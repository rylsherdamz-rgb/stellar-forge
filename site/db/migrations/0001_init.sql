-- Stellar Forge metadata layer (SPEC §7, §8).
--
-- The database is NOT the source of truth for funds: the Soroban contract is.
-- These tables hold descriptions, profiles, GitHub data and a cache of chain
-- state. Every financial row references a Stellar transaction hash so it can
-- be independently verified.

create table if not exists users (
  wallet_address  text primary key check (wallet_address ~ '^G[A-Z2-7]{55}$'),
  github_username text,
  created_at      timestamptz not null default now()
);

create table if not exists bounties (
  id                  text primary key,
  contract_id         text not null check (contract_id ~ '^C[A-Z2-7]{55}$'),
  escrow_id           bigint,
  title               text not null,
  description         text not null,
  requirements        text not null,
  acceptance_criteria text not null,
  github_repository   text not null check (github_repository ~ '^[^/]+/[^/]+$'),
  tech                text[] not null default '{}',
  reward_amount       numeric(20, 7) not null check (reward_amount > 0),
  asset               text not null default 'XLM',
  deadline_ledger     integer,
  status              text not null check (status in
                        ('OPEN','CLAIMED','SUBMITTED','COMPLETED','CANCELLED','EXPIRED','DISPUTED','REFUNDED')),
  onchain_status      text,
  metadata_hash       text check (metadata_hash ~ '^[0-9a-f]{64}$'),
  creator             text not null references users (wallet_address),
  claimed_by          text references users (wallet_address),
  ai_review           jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (contract_id, escrow_id)
);
create index if not exists bounties_creator_idx on bounties (creator);
create index if not exists bounties_claimed_by_idx on bounties (claimed_by);
create index if not exists bounties_status_idx on bounties (status);

-- Every proof submitted for a bounty (latest one is the active submission).
create table if not exists submissions (
  id              bigint generated always as identity primary key,
  bounty_id       text not null references bounties (id) on delete cascade,
  developer       text not null references users (wallet_address),
  github_pr_url   text not null check (github_pr_url ~ '^https://github\.com/[^/]+/[^/]+/pull/[0-9]+'),
  github_login    text,
  commit_hash     text,
  description     text not null default '',
  submission_hash text check (submission_hash ~ '^[0-9a-f]{64}$'),
  verified        boolean,
  verify_reasons  text[] not null default '{}',
  submitted_at    timestamptz not null default now()
);
create index if not exists submissions_bounty_idx on submissions (bounty_id, submitted_at desc);

-- One row per on-chain action. tx_hash is required: no hash, no row.
create table if not exists transactions (
  tx_hash    text primary key check (tx_hash ~ '^[0-9a-f]{64}$'),
  bounty_id  text not null references bounties (id) on delete cascade,
  type       text not null check (type in
               ('ESCROW_DEPOSIT','CLAIM','SUBMIT','BOUNTY_RELEASE','REFUND','CANCEL')),
  asset      text,
  amount     numeric(20, 7),
  sender     text,
  recipient  text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_bounty_idx on transactions (bounty_id);

-- Indexed contract events (lib/indexer.ts). Keyed by RPC event id: re-ingest is a no-op.
create table if not exists contract_events (
  id          text primary key,
  contract_id text not null,
  ledger      integer not null,
  closed_at   timestamptz not null,
  tx_hash     text not null,
  kind        text not null,
  escrow_id   bigint not null,
  data        jsonb not null default '{}'
);
create index if not exists contract_events_lookup_idx on contract_events (contract_id, escrow_id, ledger);

create table if not exists indexer_state (
  contract_id text primary key,
  cursor      text,
  last_ledger integer,
  synced_at   timestamptz
);

-- Row Level Security (Supabase): everything users see is public read-only.
-- All writes go through the app's server with the service role / direct
-- connection, which bypasses RLS. No insert/update/delete policies exist, so
-- the anon and authenticated keys can never write.
alter table users           enable row level security;
alter table bounties        enable row level security;
alter table submissions     enable row level security;
alter table transactions    enable row level security;
alter table contract_events enable row level security;
alter table indexer_state   enable row level security;  -- private: no policies

do $$
declare t text;
begin
  foreach t in array array['users','bounties','submissions','transactions','contract_events'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_public_read') then
      execute format('create policy %I on %I for select using (true)', t || '_public_read', t);
    end if;
  end loop;
end $$;
