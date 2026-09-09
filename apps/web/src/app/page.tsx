import Link from "next/link";
import Reveal from "@/components/Reveal";

const steps = [
  { n: "1", title: "Create & Fund", body: "Connect a Stellar wallet, describe the task, and deposit the XLM reward into the escrow contract. Funded on creation." },
  { n: "2", title: "Claim & Build", body: "A developer claims the open bounty and does the work. The contract prevents double-claims." },
  { n: "3", title: "Submit Proof", body: "The developer submits a GitHub Pull Request URL. Forge verifies the repo and author before it counts." },
  { n: "4", title: "Approve & Settle", body: "The creator approves with a wallet signature and the contract releases the reward as a verifiable Stellar transaction." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-inner">
          <div>
            <h1>
              Fund software work.
              <br />
              <span>Get paid on Stellar.</span>
            </h1>
            <p className="hero-lead">
              Post a bounty and the reward is escrowed in a Soroban smart contract.
              Developers claim, submit a GitHub PR as proof, and once you approve the
              contract releases XLM to their wallet.
            </p>
            <div className="hero-actions">
              <Link href="/bounties" className="btn btn-primary">Explore Bounties</Link>
              <Link href="/create" className="btn btn-secondary">Create a Bounty</Link>
            </div>
          </div>

          <div className="preview">
            <div className="preview-head">
              <span className="status OPEN">Open</span>
              <span className="reward">25 XLM</span>
            </div>
            <h3>Fix mobile navigation bug</h3>
            <p>Fix the mobile nav, preserve desktop behavior, and add a regression test.</p>
            <div className="steps-mini">
              <div className="mini-row"><span className="mini-dot" /> Reward escrowed on-chain</div>
              <div className="mini-row"><span className="mini-dot" /> GitHub PR verified (repo + author)</div>
              <div className="mini-row"><span className="mini-dot" /> Creator-signed release</div>
            </div>
          </div>
        </div>
      </section>

      <section className="block section-alt">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">
            Four steps from a funded task to a settled payment. The contract is the
            source of truth for the money at every step.
          </p>
          <div className="grid">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 70}>
                <div className="card">
                  <span className="card-step">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
