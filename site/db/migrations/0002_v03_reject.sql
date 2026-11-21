-- Contract v0.3: revision requests (reject_submission).
alter table bounties add column if not exists rejections jsonb not null default '[]';

alter table transactions drop constraint if exists transactions_type_check;
alter table transactions add constraint transactions_type_check check (type in
  ('ESCROW_DEPOSIT','CLAIM','SUBMIT','BOUNTY_RELEASE','REFUND','CANCEL','REJECT'));
