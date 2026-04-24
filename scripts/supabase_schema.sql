-- =============================================================================
-- Covenant Protocol — Full Supabase Schema
-- Run this on a fresh Supabase project: SQL Editor → Run
-- Safe to re-run: all statements use IF NOT EXISTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- One row per wallet address. Created on first KYC submission.
-- -----------------------------------------------------------------------------
create table if not exists users (
  id             uuid        primary key default gen_random_uuid(),
  wallet_address text        not null unique,
  created_at     timestamptz not null default now()
);

create index if not exists users_wallet_idx
  on users (wallet_address);

-- -----------------------------------------------------------------------------
-- kyc_submissions
-- One row per application. A wallet may resubmit after expiry or rejection.
-- status: 'pending' | 'approved' | 'rejected' | 'revoked'
-- -----------------------------------------------------------------------------
create table if not exists kyc_submissions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        references users (id) on delete cascade,
  wallet_address          text        not null,
  email                   text        not null,
  phone                   text,
  full_name               text        not null,
  tier_requested          int4        not null,
  status                  text        not null default 'pending',
  submitted_at            timestamptz not null default now(),
  reviewed_at             timestamptz,
  reviewed_by             text,
  signature               text,
  rejection_reason        text,
  email_verified          boolean     not null default false,
  verification_token      text,
  verification_expires_at timestamptz
);

create index if not exists kyc_wallet_idx
  on kyc_submissions (wallet_address);

create index if not exists kyc_status_verified_idx
  on kyc_submissions (status, email_verified);

create index if not exists kyc_token_idx
  on kyc_submissions (verification_token)
  where verification_token is not null;

-- -----------------------------------------------------------------------------
-- seals
-- One row per on-chain minted seal. Written after mint tx confirms.
-- -----------------------------------------------------------------------------
create table if not exists seals (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references users (id) on delete cascade,
  wallet_address   text        not null unique,
  seal_id          int4        not null unique,
  tier             int4        not null,
  transaction_hash text,
  minted_at        timestamptz not null default now()
);

create index if not exists seals_wallet_idx
  on seals (wallet_address);

create index if not exists seals_seal_id_idx
  on seals (seal_id);

-- -----------------------------------------------------------------------------
-- tree_links
-- Off-chain index of the on-chain trust tree.
-- The contract is always the source of truth — this is a cache for
-- Covenant admin visibility and fast queries without chain calls.
--
-- child_tier range: 1 (Bronze) – 4 (Platinum).
-- Diamond (5) is always a root seal holder, never a linked wallet.
--
-- unlinked_at null → link is active
-- unlinked_at set  → link was removed (row kept for audit trail)
-- -----------------------------------------------------------------------------
create table if not exists tree_links (
  id             uuid        primary key default gen_random_uuid(),
  root_address   text        not null,
  parent_address text        not null,
  child_address  text        not null,
  child_tier     int4        not null,
  tx_hash        text,
  linked_at      timestamptz,
  unlinked_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Full tree by root (Covenant admin view)
create index if not exists tree_links_root_idx
  on tree_links (root_address);

-- Parent chain traversal
create index if not exists tree_links_parent_idx
  on tree_links (parent_address);

-- Active links by root — most common query pattern
create index if not exists tree_links_active_root_idx
  on tree_links (root_address)
  where unlinked_at is null;

-- Fast child lookup
create index if not exists tree_links_child_active_idx
  on tree_links (child_address)
  where unlinked_at is null;
