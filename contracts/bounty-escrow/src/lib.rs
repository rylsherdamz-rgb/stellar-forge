#![no_std]
//! Stellar Forge bounty escrow.
//!
//! The contract — not the frontend, not the AI assistant, not the indexer — is
//! the source of truth for whether funds move. Every exit path is explicit:
//!
//! ```text
//!            create (escrow funded)
//!                  │
//!                  ▼
//!   cancel ◄──── Open ◄──────── unclaim
//!  (Cancelled)     │ claim         ▲
//!                  ▼               │
//!   refund ◄──── Claimed ──────────┘
//! (after deadline) │ submit (before deadline)
//!                  ▼
//!              Submitted ──── approve ───► Completed (developer paid)
//!                  │ dispute (creator or developer)
//!                  ▼
//!              Disputed ── resolve (admin) ─► Completed | Refunded
//! ```
//!
//! Admin powers are deliberately narrow: pause new activity, curate the token
//! allowlist, settle disputes, rotate the admin, and upgrade the WASM. The admin
//! can never move funds outside a dispute, and pausing never blocks exits.
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, BytesN, Env,
};

const DAY_LEDGERS: u32 = 17280; // ~5s ledgers
const TTL_THRESHOLD: u32 = DAY_LEDGERS * 7;
const TTL_EXTEND_TO: u32 = DAY_LEDGERS * 30;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    /// Admin address (deployer/platform).
    Admin,
    /// Monotonic bounty id counter.
    NextId,
    /// Per-bounty state.
    Bounty(u64),
    /// Emergency stop flag for new activity (create/claim).
    Paused,
    /// Token allowlist entry (SPEC §17: verified assets only).
    AllowedToken(Address),
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Status {
    Open = 0,
    Claimed = 1,
    Submitted = 2,
    Completed = 3,
    Cancelled = 4,
    /// Reserved; kept so on-chain discriminants stay stable.
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

/// Error codes are part of the public ABI — append only, never renumber.
/// `#[contracterror]` (not `#[contracttype]`) so callers decode the real code
/// instead of a generic host error.
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
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
    Paused = 17,
    TokenNotAllowed = 18,
    SelfClaim = 19,
    NotParty = 20,
    NotDisputed = 21,
}

// ---- events (topics: "bounty", <action>, bounty_id) ----

#[contractevent(topics = ["bounty", "created"], data_format = "vec")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyCreated {
    #[topic]
    pub id: u64,
    pub creator: Address,
    pub token: Address,
    pub amount: i128,
    pub deadline: u32,
}

#[contractevent(topics = ["bounty", "claimed"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyClaimed {
    #[topic]
    pub id: u64,
    pub developer: Address,
}

#[contractevent(topics = ["bounty", "unclaimed"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyUnclaimed {
    #[topic]
    pub id: u64,
    pub developer: Address,
}

#[contractevent(topics = ["bounty", "submitted"], data_format = "vec")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountySubmitted {
    #[topic]
    pub id: u64,
    pub developer: Address,
    pub submission_hash: BytesN<32>,
}

#[contractevent(topics = ["bounty", "completed"], data_format = "vec")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyCompleted {
    #[topic]
    pub id: u64,
    pub developer: Address,
    pub amount: i128,
}

#[contractevent(topics = ["bounty", "cancelled"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyCancelled {
    #[topic]
    pub id: u64,
    pub amount: i128,
}

#[contractevent(topics = ["bounty", "refunded"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyRefunded {
    #[topic]
    pub id: u64,
    pub amount: i128,
}

#[contractevent(topics = ["bounty", "disputed"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyDisputed {
    #[topic]
    pub id: u64,
    pub by: Address,
}

#[contractevent(topics = ["bounty", "deadline"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DeadlineExtended {
    #[topic]
    pub id: u64,
    pub deadline: u32,
}

#[contractevent(topics = ["admin", "paused"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PausedChanged {
    pub paused: bool,
}

#[contractevent(topics = ["admin", "token"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenAllowlistChanged {
    #[topic]
    pub token: Address,
    pub allowed: bool,
}

#[contractevent(topics = ["admin", "rotated"], data_format = "single-value")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdminRotated {
    pub new_admin: Address,
}

#[contract]
pub struct BountyEscrow;

#[contractimpl]
impl BountyEscrow {
    /// One-time initialization. `admin` curates tokens, pauses, and settles disputes.
    pub fn initialize(env: Env, admin: Address) -> Result<(), BountyError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BountyError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        env.storage().instance().set(&DataKey::Paused, &false);
        bump_instance(&env);
        Ok(())
    }

    // ---- admin ----

    /// Stop new bounties and claims. Exits (approve/cancel/refund/dispute) stay open.
    pub fn pause(env: Env) -> Result<(), BountyError> {
        require_admin(&env)?;
        set_paused(&env, true);
        Ok(())
    }

    pub fn unpause(env: Env) -> Result<(), BountyError> {
        require_admin(&env)?;
        set_paused(&env, false);
        Ok(())
    }

    /// Add or remove a token (SAC address) from the deposit allowlist.
    pub fn set_token_allowed(env: Env, token: Address, allowed: bool) -> Result<(), BountyError> {
        require_admin(&env)?;
        let key = DataKey::AllowedToken(token.clone());
        if allowed {
            env.storage().persistent().set(&key, &true);
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        } else {
            env.storage().persistent().remove(&key);
        }
        TokenAllowlistChanged { token, allowed }.publish(&env);
        Ok(())
    }

    /// Hand the admin role to `new_admin`. Both parties must sign, so the role
    /// can never be sent to an address nobody controls.
    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), BountyError> {
        require_admin(&env)?;
        new_admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        bump_instance(&env);
        AdminRotated { new_admin }.publish(&env);
        Ok(())
    }

    /// Replace this contract's WASM in place. Storage (and escrowed funds) persist.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), BountyError> {
        require_admin(&env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }

    /// Settle a disputed bounty: pay the developer, or refund the creator.
    pub fn resolve_dispute(env: Env, bounty_id: u64, pay_developer: bool) -> Result<(), BountyError> {
        require_admin(&env)?;
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Disputed {
            return Err(BountyError::NotDisputed);
        }
        if pay_developer {
            let developer = b.developer.clone().ok_or(BountyError::NotDeveloper)?;
            pay(&env, &b.token, &developer, b.amount)?;
            b.status = Status::Completed;
            write_bounty(&env, &b);
            BountyCompleted { id: bounty_id, developer, amount: b.amount }.publish(&env);
        } else {
            pay(&env, &b.token, &b.creator, b.amount)?;
            b.status = Status::Refunded;
            write_bounty(&env, &b);
            BountyRefunded { id: bounty_id, amount: b.amount }.publish(&env);
        }
        Ok(())
    }

    // ---- bounty lifecycle ----

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
        require_not_paused(&env)?;
        if amount <= 0 {
            return Err(BountyError::ZeroAmount);
        }
        if deadline <= env.ledger().sequence() {
            return Err(BountyError::InvalidDeadline);
        }
        if !is_allowed(&env, &token) {
            return Err(BountyError::TokenNotAllowed);
        }

        // Pull the reward into escrow up front — funded on creation.
        token::Client::new(&env, &token).transfer(&creator, &env.current_contract_address(), &amount);

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let bounty = Bounty {
            id,
            creator: creator.clone(),
            developer: None,
            token: token.clone(),
            amount,
            deadline,
            status: Status::Open,
            metadata_hash,
            submission_hash: None,
        };
        write_bounty(&env, &bounty);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        bump_instance(&env);
        BountyCreated { id, creator, token, amount, deadline }.publish(&env);
        Ok(id)
    }

    /// A developer claims an open bounty.
    pub fn claim_bounty(env: Env, bounty_id: u64, developer: Address) -> Result<(), BountyError> {
        developer.require_auth();
        require_not_paused(&env)?;
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Open {
            return Err(BountyError::AlreadyClaimed);
        }
        if b.deadline <= env.ledger().sequence() {
            return Err(BountyError::PastDeadline);
        }
        if b.creator == developer {
            return Err(BountyError::SelfClaim);
        }
        b.developer = Some(developer.clone());
        b.status = Status::Claimed;
        write_bounty(&env, &b);
        BountyClaimed { id: bounty_id, developer }.publish(&env);
        Ok(())
    }

    /// The claiming developer abandons the bounty; it reopens for others.
    pub fn unclaim_bounty(env: Env, bounty_id: u64, developer: Address) -> Result<(), BountyError> {
        developer.require_auth();
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Claimed {
            return Err(BountyError::NotClaimed);
        }
        require_developer(&b, &developer)?;
        b.developer = None;
        b.status = Status::Open;
        write_bounty(&env, &b);
        BountyUnclaimed { id: bounty_id, developer }.publish(&env);
        Ok(())
    }

    /// The claiming developer submits proof of work, before the deadline.
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
        require_developer(&b, &developer)?;
        // Without this, a creator could refund while a submission is in flight.
        if b.deadline <= env.ledger().sequence() {
            return Err(BountyError::PastDeadline);
        }
        b.submission_hash = Some(submission_hash.clone());
        b.status = Status::Submitted;
        write_bounty(&env, &b);
        BountySubmitted { id: bounty_id, developer, submission_hash }.publish(&env);
        Ok(())
    }

    /// Creator approves a submission AND releases the escrowed reward to the
    /// developer in one authorized call.
    pub fn approve_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        if b.status != Status::Submitted {
            return Err(BountyError::NotSubmitted);
        }
        let developer = b.developer.clone().ok_or(BountyError::NotDeveloper)?;
        pay(&env, &b.token, &developer, b.amount)?;
        b.status = Status::Completed;
        write_bounty(&env, &b);
        BountyCompleted { id: bounty_id, developer, amount: b.amount }.publish(&env);
        Ok(())
    }

    /// Alias of `approve_bounty`, kept for client compatibility.
    pub fn release_payment(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        Self::approve_bounty(env, bounty_id)
    }

    /// Either party escalates a submitted bounty to the admin. Funds stay
    /// locked until `resolve_dispute`; neither side can withdraw unilaterally.
    pub fn dispute_bounty(env: Env, bounty_id: u64, caller: Address) -> Result<(), BountyError> {
        caller.require_auth();
        let mut b = read_bounty(&env, bounty_id)?;
        if b.status != Status::Submitted {
            return Err(BountyError::NotSubmitted);
        }
        let is_dev = b.developer.as_ref() == Some(&caller);
        if caller != b.creator && !is_dev {
            return Err(BountyError::NotParty);
        }
        b.status = Status::Disputed;
        write_bounty(&env, &b);
        BountyDisputed { id: bounty_id, by: caller }.publish(&env);
        Ok(())
    }

    /// Creator pushes the deadline later (never earlier).
    pub fn extend_deadline(env: Env, bounty_id: u64, new_deadline: u32) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        match b.status {
            Status::Open | Status::Claimed | Status::Submitted => {}
            _ => return Err(BountyError::BadStatus),
        }
        if new_deadline <= b.deadline || new_deadline <= env.ledger().sequence() {
            return Err(BountyError::InvalidDeadline);
        }
        b.deadline = new_deadline;
        write_bounty(&env, &b);
        DeadlineExtended { id: bounty_id, deadline: new_deadline }.publish(&env);
        Ok(())
    }

    /// Creator cancels an unclaimed bounty and is refunded.
    pub fn cancel_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        if b.status != Status::Open {
            return Err(BountyError::BadStatus);
        }
        pay(&env, &b.token, &b.creator, b.amount)?;
        b.status = Status::Cancelled;
        write_bounty(&env, &b);
        BountyCancelled { id: bounty_id, amount: b.amount }.publish(&env);
        Ok(())
    }

    /// Refund the creator after the deadline for a bounty that never received
    /// a submission (Open or Claimed). Submitted/Disputed bounties are settled
    /// by approval or dispute resolution instead.
    pub fn refund_bounty(env: Env, bounty_id: u64) -> Result<(), BountyError> {
        let mut b = read_bounty(&env, bounty_id)?;
        b.creator.require_auth();
        match b.status {
            Status::Open | Status::Claimed => {}
            _ => return Err(BountyError::BadStatus),
        }
        if b.deadline > env.ledger().sequence() {
            return Err(BountyError::BeforeDeadline);
        }
        pay(&env, &b.token, &b.creator, b.amount)?;
        b.status = Status::Refunded;
        write_bounty(&env, &b);
        BountyRefunded { id: bounty_id, amount: b.amount }.publish(&env);
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
        read_admin(&env)
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }

    pub fn is_token_allowed(env: Env, token: Address) -> bool {
        is_allowed(&env, &token)
    }
}

// ---- internals ----

fn bump_instance(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn read_admin(env: &Env) -> Result<Address, BountyError> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(BountyError::NotInitialized)
}

fn require_admin(env: &Env) -> Result<Address, BountyError> {
    let admin = read_admin(env)?;
    admin.require_auth();
    Ok(admin)
}

fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&DataKey::Paused, &paused);
    bump_instance(env);
    PausedChanged { paused }.publish(env);
}

fn require_not_paused(env: &Env) -> Result<(), BountyError> {
    if env.storage().instance().get(&DataKey::Paused).unwrap_or(false) {
        return Err(BountyError::Paused);
    }
    Ok(())
}

fn is_allowed(env: &Env, token: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::AllowedToken(token.clone()))
}

fn require_developer(b: &Bounty, who: &Address) -> Result<(), BountyError> {
    match &b.developer {
        Some(d) if d == who => Ok(()),
        _ => Err(BountyError::NotDeveloper),
    }
}

fn read_bounty(env: &Env, id: u64) -> Result<Bounty, BountyError> {
    env.storage()
        .persistent()
        .get(&DataKey::Bounty(id))
        .ok_or(BountyError::NotFound)
}

fn write_bounty(env: &Env, b: &Bounty) {
    let key = DataKey::Bounty(b.id);
    env.storage().persistent().set(&key, b);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn pay(env: &Env, token: &Address, to: &Address, amount: i128) -> Result<(), BountyError> {
    if amount <= 0 {
        return Err(BountyError::ZeroAmount);
    }
    let client = token::Client::new(env, token);
    if client.balance(&env.current_contract_address()) < amount {
        return Err(BountyError::Underfunded);
    }
    client.transfer(&env.current_contract_address(), to, &amount);
    Ok(())
}

mod test;
