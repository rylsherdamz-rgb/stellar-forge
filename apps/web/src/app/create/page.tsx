"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { runAction } from "@/lib/actions";

const DAY_LEDGERS = 17280; // ~5s ledgers/day on testnet

export default function CreatePage() {
  const { address, connect } = useWallet();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    acceptanceCriteria: "",
    githubRepository: "",
    rewardAmount: "",
    deadlineDays: "7",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    if (!address) { await connect(); return; }
    setBusy(true);
    try {
      // 1. Create off-chain metadata record.
      const createRes = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creator: address }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);
      const bountyId = createData.bounty.id as string;

      // 2. Read chain: next escrow id + current ledger for the deadline.
      const chain = await (await fetch("/api/chain")).json();
      const deadlineLedger =
        Number(chain.latestLedger) + Number(form.deadlineDays) * DAY_LEDGERS;

      // 3. Build + sign + confirm create_bounty (deposits the XLM reward).
      const { txHash } = await runAction(bountyId, "create", address, {
        deadlineLedger,
        escrowId: chain.nextId,
      });
      console.log("Funded on-chain, tx:", txHash);
      router.push(`/bounties/${bountyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create bounty");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="block">
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 className="section-title">Create a bounty</h2>
        <p style={{ color: "var(--text-dim)", marginTop: -10 }}>
          The reward is deposited into the Soroban escrow contract when you sign —
          the bounty is funded on creation.
        </p>

        {error && <div className="notice err">{error}</div>}

        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Fix mobile navigation bug" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="field">
          <label>Requirements</label>
          <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
        </div>
        <div className="field">
          <label>Acceptance criteria</label>
          <textarea value={form.acceptanceCriteria} onChange={(e) => set("acceptanceCriteria", e.target.value)} />
        </div>
        <div className="field">
          <label>GitHub repository (owner/repo)</label>
          <input value={form.githubRepository} onChange={(e) => set("githubRepository", e.target.value)} placeholder="alice/project" />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Reward (XLM)</label>
            <input type="number" min="0" step="0.0000001" value={form.rewardAmount} onChange={(e) => set("rewardAmount", e.target.value)} placeholder="25" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Deadline (days)</label>
            <input type="number" min="1" value={form.deadlineDays} onChange={(e) => set("deadlineDays", e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Funding escrow…" : address ? "Create & Fund Bounty" : "Connect Wallet to Create"}
        </button>
      </div>
    </section>
  );
}
