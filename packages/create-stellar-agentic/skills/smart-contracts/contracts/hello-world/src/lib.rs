#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Counter,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
}

#[contractevent]
pub struct Incremented {
    #[topic]
    pub by: Address,
    pub count: u32,
}

#[contract]
pub struct HelloWorld;

#[contractimpl]
impl HelloWorld {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Counter, &0u32);
    }

    pub fn increment(env: Env) -> Result<u32, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let count: u32 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let count = count + 1;
        env.storage().instance().set(&DataKey::Counter, &count);

        let ledger_seq = env.ledger().sequence();
        env.storage()
            .instance()
            .extend_ttl(120 * 17280, 180 * 17280);

        Incremented { by: admin, count }.publish(&env);
        Ok(count)
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }
}

mod test;
