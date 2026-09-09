"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { runAction } from "@/lib/actions";

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    githubPrUrl: "",
    githubLogin: "",
    description: "",
    commitHash: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    if (!address) { await connect(); return; }
    if (!/^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(form.githubPrUrl)) {
      setError("Enter a valid GitHub Pull Request URL");
      return;
    }
    setBusy(true);
    try {
      await runAction(id, "submit", address, { ...form });
      router.push(`/bounties/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="block">
      <div className="container" style={{ maxWidth: 560 }}>
        <h2 className="section-title">Submit proof of work</h2>
        <p style={{ color: "var(--text-dim)", marginTop: -10 }}>
          Submit your Pull Request as proof. Forge verifies the repo and author,
          then records the submission on-chain for the creator to review.
        </p>
        {error && <div className="notice err">{error}</div>}
        <div className="field">
          <label>GitHub Pull Request URL</label>
          <input value={form.githubPrUrl} onChange={(e) => set("githubPrUrl", e.target.value)} placeholder="https://github.com/alice/project/pull/42" />
        </div>
        <div className="field">
          <label>Your GitHub username</label>
          <input value={form.githubLogin} onChange={(e) => set("githubLogin", e.target.value)} placeholder="bob" />
        </div>
        <div className="field">
          <label>Commit hash (optional)</label>
          <input value={form.commitHash} onChange={(e) => set("commitHash", e.target.value)} />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Submitting…" : address ? "Submit Proof" : "Connect Wallet to Submit"}
        </button>
      </div>
    </section>
  );
}
