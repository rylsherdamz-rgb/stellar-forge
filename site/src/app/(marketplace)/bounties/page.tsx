"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Bounty } from "@/lib/store";

const DAY_LEDGERS = 17280;

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestLedger, setLatestLedger] = useState<number | null>(null);

  const [techFilter, setTechFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rewardFilter, setRewardFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/bounties").then((r) => r.json()),
      fetch("/api/chain").then((r) => r.json()),
    ])
      .then(([bountyData, chainData]) => {
        setBounties(bountyData.bounties || []);
        setLatestLedger(Number(chainData.latestLedger));
      })
      .finally(() => setLoading(false));
  }, []);

  const techOptions = useMemo(() => {
    const values = new Set<string>();

    for (const bounty of bounties) {
      for (const tech of bounty.tech ?? []) {
        if (tech.trim()) {
          values.add(tech.trim());
        }
      }
    }

    return Array.from(values).sort();
  }, [bounties]);

  const filteredBounties = useMemo(() => {
    return bounties.filter((bounty) => {
      // Technology filter
      if (
        techFilter !== "all" &&
        !(bounty.tech ?? []).some(
          (tech) => tech.toLowerCase() === techFilter.toLowerCase(),
        )
      ) {
        return false;
      }

      // Asset filter
      if (assetFilter !== "all" && bounty.asset !== assetFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && bounty.status !== statusFilter) {
        return false;
      }

      // Reward filter
      const reward = Number(bounty.rewardAmount);

      if (rewardFilter === "under-10" && reward >= 10) {
        return false;
      }

      if (rewardFilter === "10-25" && (reward < 10 || reward >= 25)) {
        return false;
      }

      if (rewardFilter === "25-50" && (reward < 25 || reward >= 50)) {
        return false;
      }

      if (rewardFilter === "50-plus" && reward < 50) {
        return false;
      }

      // Deadline filter
      if (deadlineFilter !== "all") {
        if (latestLedger === null || bounty.deadlineLedger === null) {
          return false;
        }

        const remainingLedgers =
          bounty.deadlineLedger - latestLedger;

        const remainingDays = remainingLedgers / DAY_LEDGERS;

        if (
          deadlineFilter === "1-day" &&
          (remainingDays < 0 || remainingDays > 1)
        ) {
          return false;
        }

        if (
          deadlineFilter === "3-days" &&
          (remainingDays < 0 || remainingDays > 3)
        ) {
          return false;
        }

        if (
          deadlineFilter === "7-days" &&
          (remainingDays < 0 || remainingDays > 7)
        ) {
          return false;
        }

        if (
          deadlineFilter === "30-days" &&
          (remainingDays < 0 || remainingDays > 30)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    bounties,
    techFilter,
    assetFilter,
    statusFilter,
    rewardFilter,
    deadlineFilter,
    latestLedger,
  ]);

  const hasFilters =
    techFilter !== "all" ||
    assetFilter !== "all" ||
    statusFilter !== "all" ||
    rewardFilter !== "all" ||
    deadlineFilter !== "all";

  function clearFilters() {
    setTechFilter("all");
    setAssetFilter("all");
    setStatusFilter("all");
    setRewardFilter("all");
    setDeadlineFilter("all");
  }

  return (
    <section className="block">
      <div className="container">
        <div className="row-between" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Bounties</h2>

          <Link href="/create" className="btn btn-primary">
            Create a Bounty
          </Link>
        </div>

        {!loading && bounties.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div className="field">
              <label>Technology</label>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
              >
                <option value="all">All technologies</option>
                {techOptions.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Reward</label>
              <select
                value={rewardFilter}
                onChange={(e) => setRewardFilter(e.target.value)}
              >
                <option value="all">Any reward</option>
                <option value="under-10">Under 10 XLM</option>
                <option value="10-25">10–25 XLM</option>
                <option value="25-50">25–50 XLM</option>
                <option value="50-plus">50+ XLM</option>
              </select>
            </div>

            <div className="field">
              <label>Asset</label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
              >
                <option value="all">All assets</option>
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div className="field">
              <label>Deadline</label>
              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
              >
                <option value="all">Any deadline</option>
                <option value="1-day">Within 1 day</option>
                <option value="3-days">Within 3 days</option>
                <option value="7-days">Within 7 days</option>
                <option value="30-days">Within 30 days</option>
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLAIMED">Claimed</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        )}

        {!loading && bounties.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <span style={{ color: "var(--text-dim)" }}>
              Showing {filteredBounties.length} of {bounties.length} bounties
            </span>

            {hasFilters && (
              <button
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <div className="notice info">
            No bounties yet.{" "}
            <Link
              href="/create"
              style={{ color: "var(--accent)" }}
            >
              Create the first one.
            </Link>
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className="notice info">
            No bounties match the selected filters.
          </div>
        ) : (
          <div className="grid">
            {filteredBounties.map((b) => (
              <Link
                key={b.id}
                href={`/bounties/${b.id}`}
                className="card"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span className={`status ${b.status}`}>
                    {b.status}
                  </span>

                  <span className="reward">
                    {b.rewardAmount} {b.asset}
                  </span>
                </div>

                <h3>{b.title}</h3>

                <p>
                  {b.description.slice(0, 120)}
                  {b.description.length > 120 ? "…" : ""}
                </p>

                {b.tech && b.tech.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    {b.tech.map((tech) => (
                      <span
                        key={tech}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: "var(--surface-2)",
                          color: "var(--text-dim)",
                          fontSize: 12,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="meta-row" style={{ marginTop: 12 }}>
                  <span>◈ {b.githubRepository}</span>

                  {b.escrowId != null && (
                    <span>escrow #{b.escrowId}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
