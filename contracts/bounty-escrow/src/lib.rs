#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env,
};

const DAY_LEDGERS: u32 = 17280; // ~5s ledgers on testnet

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DataKey {
    /// Admin address (deployer/platform), used for pausing + fee config.
    Admin,
    /// Monotonic bounty id counter.
    NextId,
    /// Per-bounty state.
    Bounty(u64),
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Status {
    Open = 0,
    Claimed = 1,
    Submitted = 2,
    Completed = 3,
    Cancelled = 4,
    Expired = 5,
    Disputed = 6,
    Refunded = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bounty {
    pub id: u64,
    pub creator: Address,
    pub developer: Option<Address>,
    pub token: Address,
    pub amount: i128,
    /// Ledger sequence deadline.
    pub deadline: u32,
    pub status: Status,
    /// sha256 of off-chain metadata (title/requirements/acceptance criteria).
    pub metadata_hash: BytesN<32>,
    /// sha256 of the submission proof (PR url + commit hash), set on submit.
    pub submission_hash: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum BountyError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAdmin = 3,
    NotCreator = 4,
    NotDeveloper = 5,
    NotFound = 6,
    ZeroAmount = 7,
    InvalidDeadline = 8,
    BadStatus = 9,
    AlreadyClaimed = 10,
    NotClaimed = 11,
    NotSubmitted = 12,
    PastDeadline = 13,
    BeforeDeadline = 14,
    Underfunded = 15,
    Internal = 16,
}

impl From<soroban_sdk::Error> for BountyError {
    fn from(_: soroban_sdk::Error) -> Self {
        BountyError::Internal
    }
}

impl From<&BountyError> for soroban_sdk::Error {
    fn from(e: &BountyError) -> Self {
        soroban_sdk::Error::from_contract_error(*e as u32)
    }
}

impl From<BountyError> for soroban_sdk::Error {
    fn from(e: BountyError) -> Self {
        soroban_sdk::Error::from_contract_error(e as u32)
    }
}

#[contract]
pub struct BountyEscrow;

#[contractimpl]
impl BountyEscrow {
    /// One-time initialization. `admin` may configure the platform later.
    pub fn initialize(env: Env, admin: Address) -> Result<(), BountyError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BountyError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        env.storage()
            .instance()
            .extend_ttl(DAY_LEDGERS * 7, DAY_LEDGERS * 30);
        Ok(())
    }

    /// Create a bounty and deposit the reward into escrow in one call.
    /// Transfers `amount` of `token` from `creator` to the contract.
    pub fn create_bounty(
        env: Env,
        creator: Address,
        token: Address,
        amount: i128,
        deadline: u32,
        metadata_hash: BytesN<32>,
    ) -> Result<u64, BountyError> {
        creator.require_auth();
        if amount <= 0 {
            return Err(BountyError::ZeroAmount);
        }
        if deadline <= env.ledger().sequence() {
            return Err(BountyError::InvalidDeadline);
        }

        // Pull the reward into escrow up front — funded on creation.
        let client = token::Client::new(&env, &token);
        client.transfer(&creator, &env.current_contract_address(), &amount);

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let bounty = Bounty {
            id,
            creator: creator.clone(),
            developer: None,
            token,
            amount,
            deadline,
            status: Status::Open,
            metadata_hash,
            submission_hash: None,
        };
        write_bounty(&env, &bounty);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        env.storage()
            .instance()
            .extend_ttl(DAY_LEDGERS * 7, DAY_LEDGERS * 30);
        env.events()
            .publish(("bounty", "created"), (id, creator, amount));
        Ok(id)
    }

    /// A developer claims an open bounty.
    pub fn claim_bounty(env: Env, bounty_id: u64, developer: Address) -> Result<(), BountyError> {
        developer.require_auth();
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Open {
            return Err(BountyError::AlreadyClaimed);
        }
        if b.deadline <= env.ledger().sequence() {
            return Err(BountyError::PastDeadline);
        }
        b.developer = Some(developer.clone());
        b.status = Status::Claimed;
        write_bounty(&env, &b);
        env.events()
            .publish(("bounty", "claimed"), (bounty_id, developer));
        Ok(())
    }

    /// The claiming developer submits proof of work.
    pub fn submit_bounty(
        env: Env,
        bounty_id: u64,
        developer: Address,
        submission_hash: BytesN<32>,
    ) -> Result<(), BountyError> {
        developer.require_auth();
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Claimed {
            return Err(BountyError::NotClaimed);
        }
        match &b.developer {
            Some(d) if *d == developer => {}
            _ => return Err(BountyError::NotDeveloper),
        }
        b.submission_hash = Some(submission_hash);
        b.status = Status::Submitted;
        write_bounty(&env, &b);
        env.events()
            .publish(("bounty", "submitted"), (bounty_id, developer));
        Ok(())
    }

    /// Creator approves a submission AND releases the escrowed reward to the
    /// developer in one authorized call. The contract is the source of truth.
    pub fn approve_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        if b.status != Status::Submitted {
            return Err(BountyError::NotSubmitted);
        }
        let developer = match &b.developer {
            Some(d) => d.clone(),
            None => return Err(BountyError::NotDeveloper),
        };
        pay(&env, &b.token, &developer, b.amount)?;
        b.status = Status::Completed;
        write_bounty(&env, &b);
        env.events()
            .publish(("bounty", "completed"), (bounty_id, developer, b.amount));
        Ok(())
    }

    /// Explicit release (idempotent-safe alias used after off-chain approval).
    /// Requires the bounty to already be Submitted and creator-authorized.
    pub fn release_payment(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        Self::approve_bounty(env, bounty_id)
    }

    /// Creator cancels an unclaimed bounty and is refunded.
    pub fn cancel_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        if b.status != Status::Open {
            return Err(BountyError::BadStatus);
        }
        let creator = b.creator.clone();
        pay(&env, &b.token, &creator, b.amount)?;
        b.status = Status::Cancelled;
        write_bounty(&env, &b);
        env.events().publish(("bounty", "cancelled"), bounty_id);
        Ok(())
    }

    /// Refund the creator after the deadline for an unresolved bounty
    /// (Open or Claimed but never completed). Enforced on-chain.
    pub fn refund_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        match b.status {
            Status::Open | Status::Claimed | Status::Disputed => {}
            _ => return Err(BountyError::BadStatus),
        }
        if b.deadline > env.ledger().sequence() {
            return Err(BountyError::BeforeDeadline);
        }
        let creator = b.creator.clone();
        pay(&env, &b.token, &creator, b.amount)?;
        b.status = Status::Refunded;
        write_bounty(&env, &b);
        env.events().publish(("bounty", "refunded"), bounty_id);
        Ok(())
    }

    // ---- read-only views ----

    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<Bounty, BountyError> {
        read_bounty(&env, bounty_id)
    }

    pub fn next_id(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::NextId).unwrap_or(0)
    }

    pub fn admin(env: Env) -> Result<Address, BountyError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(BountyError::NotInitialized)
    }
}

fn read_bounty(env: &Env, id: u64) -> Result<Bounty, BountyError> {
    env.storage()
        .persistent()
        .get(&DataKey::Bounty(id))
        .ok_or(BountyError::NotFound)
}

fn write_bounty(env: &Env, b: &Bounty) {
    env.storage().persistent().set(&DataKey::Bounty(b.id), b);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Bounty(b.id), DAY_LEDGERS * 7, DAY_LEDGERS * 30);
}

fn pay(env: &Env, token: &Address, to: &Address, amount: i128) -> Result<(), BountyError> {
    if amount <= 0 {
        return Err(BountyError::ZeroAmount);
    }
    let client = token::Client::new(env, token);
    let balance = client.balance(&env.current_contract_address());
    if balance < amount {
        return Err(BountyError::Underfunded);
    }
    client.transfer(&env.current_contract_address(), to, &amount);
    Ok(())
}

mod test;
