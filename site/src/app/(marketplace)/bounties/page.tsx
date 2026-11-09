"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BountyCard from "@/components/BountyCard";
import { useChain } from "@/hooks/useChain";
import { LEDGERS_PER_DAY } from "@/lib/lifecycle";
import type { Bounty } from "@/lib/store";

const REWARD_RANGES: Record<string, [number, number]> = {
  "under-10": [0, 10],
  "10-25": [10, 25],
  "25-50": [25, 50],
  "50-plus": [50, Infinity],
};
const DEADLINE_DAYS: Record<string, number> = { "1-day": 1, "3-days": 3, "7-days": 7, "30-days": 30 };
const STATUSES = ["OPEN", "CLAIMED", "SUBMITTED", "COMPLETED", "CANCELLED", "REFUNDED"];

const INITIAL = { q: "", tech: "all", asset: "all", status: "all", reward: "all", deadline: "all", sort: "newest" };

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState(INITIAL);
  const { chain } = useChain();
  const ledger = chain?.latestLedger ?? null;
  const set = (k: keyof typeof INITIAL, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then((d) => setBounties(d.bounties || []))
      .catch(() => setBounties([]))
      .finally(() => setLoading(false));
  }, []);

  const techOptions = useMemo(
    () => Array.from(new Set(bounties.flatMap((b) => (b.tech ?? []).map((t) => t.trim())).filter(Boolean))).sort(),
    [bounties],
  );
  const assetOptions = useMemo(() => Array.from(new Set(bounties.map((b) => b.asset))).sort(), [bounties]);

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = bounties.filter((b) => {
      if (q && ![b.title, b.description, b.githubRepository, ...(b.tech ?? [])].some((s) => s.toLowerCase().includes(q))) return false;
      if (f.tech !== "all" && !(b.tech ?? []).some((t) => t.toLowerCase() === f.tech.toLowerCase())) return false;
      if (f.asset !== "all" && b.asset !== f.asset) return false;
      if (f.status !== "all" && b.status !== f.status) return false;
      if (f.reward !== "all") {
        const [lo, hi] = REWARD_RANGES[f.reward];
        const r = Number(b.rewardAmount);
        if (r < lo || r >= hi) return false;
      }
      if (f.deadline !== "all") {
        // Unknown ledger: don't hide everything, just skip the filter.
        if (ledger != null) {
          if (b.deadlineLedger == null) return false;
          const days = (b.deadlineLedger - ledger) / LEDGERS_PER_DAY;
          if (days < 0 || days > DEADLINE_DAYS[f.deadline]) return false;
        }
      }
      return true;
    });
    const sorters: Record<string, (a: Bounty, b: Bounty) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      reward: (a, b) => Number(b.rewardAmount) - Number(a.rewardAmount),
      deadline: (a, b) => (a.deadlineLedger ?? Infinity) - (b.deadlineLedger ?? Infinity),
    };
    return list.sort(sorters[f.sort]);
  }, [bounties, f, ledger]);

  const hasFilters = Object.entries(f).some(([k, v]) => k !== "sort" && v !== INITIAL[k as keyof typeof INITIAL]);
  const totalOpen = bounties.filter((b) => b.status === "OPEN").length;

  return (
    <section className="block">
      <div className="container">
        <div className="row-between section-head">
          <div>
            <h1 className="page-title">Bounties</h1>
            <p className="section-sub">
              {loading ? "Loading…" : `${totalOpen} open · ${bounties.length} total. Every open bounty is funded in escrow.`}
            </p>
          </div>
          <Link href="/create" className="btn btn-primary">Post a bounty</Link>
        </div>

        <div className="filters" role="search">
          <div className="field search">
            <label htmlFor="q">Search</label>
            <input id="q" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Title, repo or tech…" />
          </div>
          <Select id="tech" label="Technology" value={f.tech} onChange={(v) => set("tech", v)}
            options={[["all", "All technologies"], ...techOptions.map((t) => [t, t] as [string, string])]} />
          <Select id="status" label="Status" value={f.status} onChange={(v) => set("status", v)}
            options={[["all", "All statuses"], ...STATUSES.map((s) => [s, s[0] + s.slice(1).toLowerCase()] as [string, string])]} />
          <Select id="reward" label="Reward" value={f.reward} onChange={(v) => set("reward", v)}
            options={[["all", "Any reward"], ["under-10", "Under 10"], ["10-25", "10–25"], ["25-50", "25–50"], ["50-plus", "50+"]]} />
          <Select id="deadline" label="Deadline" value={f.deadline} onChange={(v) => set("deadline", v)}
            options={[["all", "Any deadline"], ["1-day", "Within 1 day"], ["3-days", "Within 3 days"], ["7-days", "Within 7 days"], ["30-days", "Within 30 days"]]} />
          {assetOptions.length > 1 && (
            <Select id="asset" label="Asset" value={f.asset} onChange={(v) => set("asset", v)}
              options={[["all", "All assets"], ...assetOptions.map((a) => [a, a] as [string, string])]} />
          )}
          <Select id="sort" label="Sort" value={f.sort} onChange={(v) => set("sort", v)}
            options={[["newest", "Newest"], ["reward", "Highest reward"], ["deadline", "Ending soonest"]]} />
        </div>

        <div className="results-bar">
          <span>Showing {filtered.length} of {bounties.length}</span>
          {hasFilters && (
            <button className="link-btn" onClick={() => setF({ ...INITIAL, sort: f.sort })}>Clear filters</button>
          )}
        </div>

        {loading ? (
          <div className="grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" />)}</div>
        ) : bounties.length === 0 ? (
          <div className="empty">
            <p>No bounties yet.</p>
            <Link href="/create" className="btn btn-primary">Post the first one</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p>No bounties match these filters.</p>
            <button className="btn btn-secondary" onClick={() => setF(INITIAL)}>Clear filters</button>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((b) => <BountyCard key={b.id} bounty={b} ledger={ledger} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function Select({ id, label, value, onChange, options }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
