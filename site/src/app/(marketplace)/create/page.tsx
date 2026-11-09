"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import BountyCard from "@/components/BountyCard";
import { runAction, PHASE_LABEL, type Phase } from "@/lib/actions";
import { LEDGERS_PER_DAY } from "@/lib/lifecycle";
import type { Bounty } from "@/lib/store";
import { EMPTY_FORM as EMPTY, validateBountyForm as validate, type BountyForm as Form } from "@/lib/forms";

export default function CreatePage() {
  const { address, connect } = useWallet();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const errors = validate(form);
  const show = (k: keyof Form) => (touched ? errors[k] : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);
    if (Object.keys(errors).length) return;
    const who = address ?? (await connect());
    if (!who) return;

    let bountyId: string | null = null;
    try {
      setPhase("saving");
      const chainRes = await fetch("/api/chain");
      const chain = await chainRes.json();
      if (!chainRes.ok) throw new Error(chain.error || "Could not reach Stellar RPC");
      const deadlineLedger = Number(chain.latestLedger) + Number(form.deadlineDays) * LEDGERS_PER_DAY;

      const createRes = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rewardAmount: form.rewardAmount.trim(),
          githubRepository: form.githubRepository.trim(),
          tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
          deadlineLedger,
          creator: who,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);
      bountyId = createData.bounty.id as string;

      await runAction(bountyId, "create", who, {}, setPhase);
      router.push(`/bounties/${bountyId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create bounty";
      if (bountyId) {
        // Metadata is saved; send the creator to the draft to retry funding.
        router.push(`/bounties/${bountyId}?fund=retry`);
        return;
      }
      setError(msg);
    } finally {
      setPhase(null);
    }
  }

  const preview: Bounty = {
    id: "preview",
    escrowId: null,
    title: form.title || "Your bounty title",
    description: form.description || "A short description of the task appears here.",
    requirements: "",
    acceptanceCriteria: "",
    githubRepository: form.githubRepository || "owner/repo",
    tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
    rewardAmount: form.rewardAmount || "0",
    asset: "XLM",
    deadlineLedger: null,
    status: "OPEN",
    creator: address ?? "",
    claimedBy: null,
    submission: null,
    tx: {},
    createdAt: "",
    updatedAt: "",
  };

  return (
    <section className="block">
      <div className="container create-layout">
        <form onSubmit={submit} noValidate>
          <h1 className="page-title">Post a bounty</h1>
          <p className="section-sub">
            When you sign, the reward moves into the Soroban escrow contract. It can only leave
            to the developer you approve, or back to you.
          </p>
          {error && <div className="notice err" role="alert">{error}</div>}

          <Field id="title" label="Title" error={show("title")}>
            <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Fix mobile navigation bug" />
          </Field>
          <Field id="description" label="Description" error={show("description")}>
            <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What is broken or missing, and why it matters." />
          </Field>
          <div className="two">
            <Field id="requirements" label="Requirements" error={show("requirements")}>
              <textarea id="requirements" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder={"- Works on iOS Safari\n- Includes a test"} />
            </Field>
            <Field id="acceptanceCriteria" label="Acceptance criteria" error={show("acceptanceCriteria")}>
              <textarea id="acceptanceCriteria" value={form.acceptanceCriteria} onChange={(e) => set("acceptanceCriteria", e.target.value)} placeholder={"- CI is green\n- Reviewed by a maintainer"} />
            </Field>
          </div>
          <div className="two">
            <Field id="githubRepository" label="GitHub repository" hint="owner/repo — the PR must be opened here" error={show("githubRepository")}>
              <input id="githubRepository" className="mono" value={form.githubRepository} onChange={(e) => set("githubRepository", e.target.value)} placeholder="alice/project" />
            </Field>
            <Field id="tech" label="Technologies" hint="Comma separated" error={show("tech")}>
              <input id="tech" value={form.tech} onChange={(e) => set("tech", e.target.value)} placeholder="React, TypeScript" />
            </Field>
          </div>
          <div className="two">
            <Field id="rewardAmount" label="Reward (XLM)" error={show("rewardAmount")}>
              <input id="rewardAmount" className="mono" inputMode="decimal" value={form.rewardAmount} onChange={(e) => set("rewardAmount", e.target.value)} placeholder="25" />
            </Field>
            <Field id="deadlineDays" label="Deadline (days)" hint="Refunds unlock after this" error={show("deadlineDays")}>
              <input id="deadlineDays" className="mono" inputMode="numeric" value={form.deadlineDays} onChange={(e) => set("deadlineDays", e.target.value)} />
            </Field>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!!phase}>
            {phase ? (phase === "saving" ? "Saving details…" : PHASE_LABEL[phase]) : address ? "Create & fund bounty" : "Connect wallet to create"}
          </button>
        </form>

        <aside className="create-side">
          <span className="stat-k">Preview</span>
          <BountyCard bounty={preview} ledger={null} />
          <ol className="checklist small">
            <li>Details are saved off-chain; a SHA-256 of them is stored on-chain.</li>
            <li>Your wallet signs <code>create_bounty</code>, moving {form.rewardAmount || "the"} XLM into escrow.</li>
            <li>The listing goes public once the transaction confirms.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}

function Field({ id, label, hint, error, children }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field${error ? " invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <small className="field-err">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null}
    </div>
  );
}
