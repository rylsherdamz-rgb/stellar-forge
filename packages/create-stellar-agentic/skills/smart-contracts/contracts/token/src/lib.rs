#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, BytesN, Env, String,
    Symbol,
};

const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    Balance(Address),
    Allowance(Address, Address),
    TotalSupply,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum TokenError {
    Uninitialized = 1,
    AlreadyInitialized = 2,
    InsufficientBalance = 3,
    InsufficientAllowance = 4,
    InvalidAmount = 5,
}

fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

fn extend_balance_ttl(env: &Env, addr: &Address) {
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Balance(addr.clone()), BUMP_THRESHOLD, BUMP_TO);
}

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn __constructor(
        env: Env,
        admin: Address,
        name: String,
        symbol: Symbol,
        decimals: u32,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &0i128);
        extend_instance_ttl(&env);
    }

    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .expect("not initialized")
    }

    pub fn symbol(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .expect("not initialized")
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Decimals)
            .expect("not initialized")
    }

    pub fn balance(env: Env, addr: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(addr))
            .unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .expect("not initialized")
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        let mut balance = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        balance = balance.checked_add(amount).expect("overflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &balance);

        let mut supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        supply = supply.checked_add(amount).expect("overflow");
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &supply);

        extend_instance_ttl(&env);
        extend_balance_ttl(&env, &to);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }
        from.require_auth();

        let mut from_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        if from_bal < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        from_bal = from_bal.checked_sub(amount).expect("underflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &from_bal);

        let mut to_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        to_bal = to_bal.checked_add(amount).expect("overflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &to_bal);

        extend_balance_ttl(&env, &from);
        extend_balance_ttl(&env, &to);
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        if amount < 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }
        from.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &amount);
        extend_balance_ttl(&env, &from);
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }
        spender.require_auth();

        let mut allowed: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Allowance(from.clone(), spender.clone()))
            .unwrap_or(0);
        if allowed < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }
        allowed = allowed.checked_sub(amount).expect("underflow");
        env.storage()
            .persistent()
            .set(
                &DataKey::Allowance(from.clone(), spender.clone()),
                &allowed,
            );

        let mut from_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        if from_bal < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        from_bal = from_bal.checked_sub(amount).expect("underflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &from_bal);

        let mut to_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);
        to_bal = to_bal.checked_add(amount).expect("overflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &to_bal);

        extend_balance_ttl(&env, &from);
        extend_balance_ttl(&env, &to);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }
        from.require_auth();

        let mut from_bal: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        if from_bal < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        from_bal = from_bal.checked_sub(amount).expect("underflow");
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &from_bal);

        let mut supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        supply = supply.checked_sub(amount).expect("underflow");
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &supply);

        extend_balance_ttl(&env, &from);
        extend_instance_ttl(&env);
    }
}

mod test;
