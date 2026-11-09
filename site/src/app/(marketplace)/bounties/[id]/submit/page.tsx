"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { runAction, PHASE_LABEL, type Phase } from "@/lib/actions";
import { blockReason } from "@/lib/lifecycle";
import type { Bounty } from "@/lib/store";

const PR_RE = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

type Check = { verified: boolean; reasons: string[]; checks: Record<string, boolean> };

const CHECK_LABEL: Record<string, string> = {
  exists: "Pull request exists",
  repoMatches: "Opened in the bounty's repository",
  authorMatches: "Authored by your GitHub account",
  merged: "Merged (informational — does not release funds)",
};

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const router = useRouter();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ githubPrUrl: "", githubLogin: "", description: "", commitHash: "" });
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "githubPrUrl" || k === "githubLogin") setCheck(null);
  };

  useEffect(() => {
    fetch(`/api/bounties/${id}`).then((r) => r.json()).then((d) => setBounty(d.bounty ?? null));
  }, [id]);

  async function verify() {
    setError(null);
    if (!PR_RE.test(form.githubPrUrl)) return setError("Enter a GitHub pull request URL.");
    if (!bounty) return;
    setChecking(true);
    try {
      const qs = new URLSearchParams({ prUrl: form.githubPrUrl, repo: bounty.githubRepository, login: form.githubLogin });
      const r = await fetch(`/api/github/pull-request?${qs}`);
      setCheck(await r.json());
    } catch {
      setError("Could not reach GitHub. You can still submit; the creator will review the PR.");
    } finally {
      setChecking(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!PR_RE.test(form.githubPrUrl)) return setError("Enter a GitHub pull request URL.");
    const who = address ?? (await connect());
    if (!who) return;
    try {
      await runAction(id, "submit", who, { ...form }, setPhase);
      router.push(`/bounties/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setPhase(null);
    }
  }

  const blocked = bounty ? (bounty.demo ? "Sample listings cannot receive submissions." : blockReason(bounty, "submit", address)) : null;

  return (
    <section className="block">
      <div className="container narrow">
        <Link href={`/bounties/${id}`} className="back">← Back to bounty</Link>
        <h1 className="page-title">Submit proof of work</h1>
        {bounty && <p className="section-sub">For <strong>{bounty.title}</strong> · PR must be in <span className="mono">{bounty.githubRepository}</span></p>}
        {blocked && address && <div className="notice warn">{blocked}</div>}
        {error && <div className="notice err" role="alert">{error}</div>}

        <form onSubmit={submit} noValidate className="panel">
          <div className="field">
            <label htmlFor="pr">Pull request URL</label>
            <input id="pr" className="mono" value={form.githubPrUrl} onChange={(e) => set("githubPrUrl", e.target.value)} placeholder="https://github.com/alice/project/pull/42" />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="login">GitHub username</label>
              <input id="login" value={form.githubLogin} onChange={(e) => set("githubLogin", e.target.value)} placeholder="bob" />
            </div>
            <div className="field">
              <label htmlFor="commit">Commit hash <span className="dim">(optional)</span></label>
              <input id="commit" className="mono" value={form.commitHash} onChange={(e) => set("commitHash", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Notes for the reviewer <span className="dim">(optional)</span></label>
            <textarea id="notes" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {check && (
            <ul className="checks" aria-live="polite">
              {Object.entries(CHECK_LABEL).map(([k, label]) => (
                <li key={k} className={check.checks?.[k] ? "pass" : k === "merged" ? "info" : "fail"}>
                  <span>{check.checks?.[k] ? "✓" : k === "merged" ? "–" : "✕"}</span> {label}
                </li>
              ))}
            </ul>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={verify} disabled={checking || !!phase}>
              {checking ? "Checking GitHub…" : "Check PR"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!!phase || (!!blocked && !!address)}>
              {phase ? PHASE_LABEL[phase] : address ? "Sign & submit" : "Connect wallet to submit"}
            </button>
          </div>
          <p className="small dim">
            Submitting stores a SHA-256 of the PR URL and commit on-chain. Merging the PR does not
            release funds — the creator approves separately.
          </p>
        </form>
      </div>
    </section>
  );
}
