import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Fund software work.
            <br />
            <span>Get paid on Stellar.</span>
          </h1>
          <p>
            Post a bounty and the reward is escrowed in a Soroban smart contract.
            Developers claim the work, submit a GitHub Pull Request as proof, and —
            once you approve — the contract releases XLM to their wallet. The
            blockchain controls the money, not the frontend.
          </p>
          <div className="hero-actions">
            <Link href="/bounties" className="btn btn-primary">
              Explore Bounties
            </Link>
            <Link href="/create" className="btn btn-secondary">
              Create a Bounty
            </Link>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <div className="grid">
            <div className="card">
              <h3>1 · Create &amp; Fund</h3>
              <p>
                Connect a Stellar wallet, describe the task, and deposit the XLM
                reward into the escrow contract — funded on creation.
              </p>
            </div>
            <div className="card">
              <h3>2 · Claim &amp; Build</h3>
              <p>
                A developer claims the open bounty and does the work. The contract
                prevents double-claims.
              </p>
            </div>
            <div className="card">
              <h3>3 · Submit Proof</h3>
              <p>
                The developer submits a GitHub Pull Request URL. Forge verifies the
                repo and author before it counts.
              </p>
            </div>
            <div className="card">
              <h3>4 · Approve &amp; Settle</h3>
              <p>
                The creator approves with a wallet signature and the contract
                releases the reward — a verifiable Stellar transaction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
