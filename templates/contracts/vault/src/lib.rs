#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, Vec,
};

const DAY_LEDGERS: u32 = 17280; // ~5s ledgers on testnet

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DataKey {
    State,
    Milestone(u32),
    MilestoneCount,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct State {
    pub depositor: Address,
    pub recipient: Address,
    pub arbiter: Address,
    pub token: Address,
    pub deadline: u32,
    pub withdrawn: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub amount: i128,
    pub release_key: BytesN<32>,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    NotDepositor = 4,
    NotRecipient = 5,
    NotArbiter = 6,
    InvalidMilestones = 7,
    ZeroAmount = 8,
    BadProof = 9,
    AlreadyClaimed = 10,
    PastDeadline = 11,
    BeforeDeadline = 12,
    NothingToWithdraw = 13,
    Underfunded = 14,
    Internal = 15,
}

impl From<soroban_sdk::Error> for VaultError {
    fn from(_: soroban_sdk::Error) -> Self {
        VaultError::Internal
    }
}

impl From<&VaultError> for soroban_sdk::Error {
    fn from(e: &VaultError) -> Self {
        soroban_sdk::Error::from_contract_error(*e as u32)
    }
}

pub trait Vault {
    fn initialize(
        env: Env,
        depositor: Address,
        recipient: Address,
        arbiter: Address,
        token: Address,
        milestones: Vec<(i128, BytesN<32>)>,
        deadline: u32,
    ) -> Result<(), VaultError>;

    fn deposit(env: Env, sender: Address) -> Result<(), VaultError>;

    fn claim_milestone(env: Env, index: u32, proof: BytesN<32>) -> Result<(), VaultError>;

    fn release(env: Env, index: u32) -> Result<(), VaultError>;

    fn refund(env: Env) -> Result<(), VaultError>;

    fn recover(env: Env) -> Result<(), VaultError>;

    fn balance(env: Env) -> Result<i128, VaultError>;

    fn total_committed(env: Env) -> Result<i128, VaultError>;
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl Vault for VaultContract {
    fn initialize(
        env: Env,
        depositor: Address,
        recipient: Address,
        arbiter: Address,
        token: Address,
        milestones: Vec<(i128, BytesN<32>)>,
        deadline: u32,
    ) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::State) {
            return Err(VaultError::AlreadyInitialized);
        }
        depositor.require_auth();
        if milestones.len() == 0 {
            return Err(VaultError::InvalidMilestones);
        }
        let mut committed: i128 = 0;
        for (i, (amount, key)) in milestones.iter().enumerate() {
            if amount <= 0 {
                return Err(VaultError::ZeroAmount);
            }
            env.storage()
                .persistent()
                .set(&DataKey::Milestone(i as u32), &Milestone {
                    amount,
                    release_key: key,
                    claimed: false,
                });
            committed = committed
                .checked_add(amount)
                .ok_or(VaultError::InvalidMilestones)?;
        }
        env.storage().persistent().set(&DataKey::MilestoneCount, &(milestones.len() as u32));
        env.storage().instance().set(
            &DataKey::State,
            &State {
                depositor,
                recipient,
                arbiter,
                token,
                deadline,
                withdrawn: 0,
            },
        );
        env.storage().instance().extend_ttl(DAY_LEDGERS * 7, DAY_LEDGERS * 30);
        env.events().publish(("vault", "initialized"), committed);
        Ok(())
    }

    fn deposit(env: Env, sender: Address) -> Result<(), VaultError> {
        let state = read_state(&env)?;
        if state.depositor != sender {
            return Err(VaultError::NotDepositor);
        }
        sender.require_auth();
        let committed = committed_total(&env);
        let client = token::Client::new(&env, &state.token);
        let current = client.balance(&env.current_contract_address());
        if current < committed {
            let shortfall = committed - current;
            client.transfer(&sender, &env.current_contract_address(), &shortfall);
        }
        env.events().publish(("vault", "deposited"), committed);
        Ok(())
    }

    fn claim_milestone(env: Env, index: u32, proof: BytesN<32>) -> Result<(), VaultError> {
        let state = read_state(&env)?;
        state.recipient.require_auth();
        let mut ms = read_milestone(&env, index)?;
        if ms.claimed {
            return Err(VaultError::AlreadyClaimed);
        }
        if env.crypto().sha256(&Bytes::from_array(&env, &proof.to_array())).to_bytes() != ms.release_key.to_array() {
            return Err(VaultError::BadProof);
        }
        ms.claimed = true;
        write_milestone(&env, index, &ms);
        pay(&env, &state.recipient, ms.amount)?;
        Ok(())
    }

    fn release(env: Env, index: u32) -> Result<(), VaultError> {
        let state = read_state(&env)?;
        state.arbiter.require_auth();
        let mut ms = read_milestone(&env, index)?;
        if ms.claimed {
            return Err(VaultError::AlreadyClaimed);
        }
        ms.claimed = true;
        write_milestone(&env, index, &ms);
        pay(&env, &state.recipient, ms.amount)?;
        Ok(())
    }

    fn refund(env: Env) -> Result<(), VaultError> {
        let state = read_state(&env)?;
        state.arbiter.require_auth();
        withdraw_unclaimed(&env, &state, &state.depositor)
    }

    fn recover(env: Env) -> Result<(), VaultError> {
        let state = read_state(&env)?;
        if env.ledger().sequence() < state.deadline {
            return Err(VaultError::BeforeDeadline);
        }
        state.depositor.require_auth();
        withdraw_unclaimed(&env, &state, &state.depositor)
    }

    fn balance(env: Env) -> Result<i128, VaultError> {
        let state = read_state(&env)?;
        let client = token::Client::new(&env, &state.token);
        Ok(client.balance(&env.current_contract_address()))
    }

    fn total_committed(env: Env) -> Result<i128, VaultError> {
        Ok(committed_total(&env))
    }
}

fn read_state(env: &Env) -> Result<State, VaultError> {
    env.storage()
        .instance()
        .get(&DataKey::State)
        .ok_or(VaultError::NotInitialized)
}

fn read_milestone(env: &Env, index: u32) -> Result<Milestone, VaultError> {
    env.storage()
        .persistent()
        .get(&DataKey::Milestone(index))
        .ok_or(VaultError::InvalidMilestones)
}

fn write_milestone(env: &Env, index: u32, ms: &Milestone) {
    env.storage().persistent().set(&DataKey::Milestone(index), ms);
    env.storage().persistent().extend_ttl(&DataKey::Milestone(index), DAY_LEDGERS * 7, DAY_LEDGERS * 30);
}

fn milestone_count(env: &Env) -> u32 {
    env.storage().persistent().get(&DataKey::MilestoneCount).unwrap_or(0)
}

fn committed_total(env: &Env) -> i128 {
    let mut total: i128 = 0;
    for i in 0..milestone_count(env) {
        if let Ok(ms) = read_milestone(env, i) {
            total += ms.amount;
        }
    }
    total
}

fn pay(env: &Env, to: &Address, amount: i128) -> Result<(), VaultError> {
    if amount <= 0 {
        return Err(VaultError::ZeroAmount);
    }
    let state = read_state(env)?;
    let client = token::Client::new(env, &state.token);
    let balance = client.balance(&env.current_contract_address());
    if balance < amount {
        return Err(VaultError::Underfunded);
    }
    client.transfer(&env.current_contract_address(), to, &amount);
    let mut new_state = state;
    new_state.withdrawn = new_state.withdrawn.checked_add(amount).ok_or(VaultError::InvalidMilestones)?;
    env.storage().instance().set(&DataKey::State, &new_state);
    env.storage().instance().extend_ttl(DAY_LEDGERS * 7, DAY_LEDGERS * 30);
    env.events().publish(("vault", "paid"), (to, amount));
    Ok(())
}

fn withdraw_unclaimed(env: &Env, state: &State, to: &Address) -> Result<(), VaultError> {
    let remaining = committed_total(env) - state.withdrawn;
    if remaining <= 0 {
        return Err(VaultError::NothingToWithdraw);
    }
    let client = token::Client::new(env, &state.token);
    client.transfer(&env.current_contract_address(), to, &remaining);
    env.events().publish(("vault", "withdrawn"), (to, remaining));
    Ok(())
}

mod test;