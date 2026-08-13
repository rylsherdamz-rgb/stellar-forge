"use client";

function StaticLaptop() {
  return (
    <svg viewBox="0 0 640 500" role="img" aria-label="Stellar Forge laptop running an agent session">
      <defs>
        <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23232b" />
          <stop offset="1" stopColor="#14141a" />
        </linearGradient>
        <linearGradient id="deckGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1b22" />
          <stop offset="1" stopColor="#101015" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.28" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <clipPath id="screenClip">
          <polygon points="80,70 560,70 545,350 95,350" />
        </clipPath>
      </defs>
      <ellipse cx="320" cy="452" rx="250" ry="28" fill="url(#glowGrad)" />
      <rect x="62" y="352" width="516" height="34" rx="10" fill="url(#deckGrad)" stroke="#2c2c34" />
      <rect x="62" y="386" width="516" height="10" rx="5" fill="#101015" />
      <rect x="120" y="338" width="400" height="12" rx="6" fill="#0d0d12" />
      <polygon points="80,70 560,70 545,350 95,350" fill="url(#lidGrad)" stroke="#2c2c34" strokeWidth="2" />
      <g clipPath="url(#screenClip)">
        <rect x="80" y="70" width="480" height="280" fill="#050508" />
        <rect x="80" y="70" width="480" height="26" fill="#0e0e12" />
        <circle cx="108" cy="83" r="4" fill="#ff5f57" />
        <circle cx="124" cy="83" r="4" fill="#febc2e" />
        <circle cx="140" cy="83" r="4" fill="#28c840" />
        <text x="300" y="87" textAnchor="middle" fill="#6e6e78" fontSize="11" fontFamily="var(--font-mono)">stellar-forge — agent session</text>
        <text x="98" y="130" fill="#c4b5fd" fontSize="13" fontFamily="var(--font-mono)">$ stellar-forge run "payment contract"</text>
        <text x="98" y="156" fill="#a2a2ab" fontSize="13" fontFamily="var(--font-mono)">graph engine → work graph built</text>
        <text x="98" y="182" fill="#a78bfa" fontSize="13" fontFamily="var(--font-mono)">@stellar-contracts → @stellar-frontend</text>
        <text x="98" y="208" fill="#a78bfa" fontSize="13" fontFamily="var(--font-mono)"> → @stellar-backend</text>
        <text x="98" y="240" fill="#4ade80" fontSize="13" fontFamily="var(--font-mono)">✓ eval passed — deployed 2.1s</text>
        <text x="98" y="266" fill="#c4b5fd" fontSize="13" fontFamily="var(--font-mono)">$</text>
        <rect x="112" y="252" width="8" height="16" fill="#c4b5fd" />
        <rect x="320" y="290" width="180" height="36" rx="6" fill="#0e0e12" stroke="#26262b" />
        <text x="335" y="313" fill="#4ade80" fontSize="11" fontFamily="var(--font-mono)">✓ EVALS PASSED</text>
      </g>
      <rect x="300" y="342" width="40" height="8" rx="4" fill="#0d0d12" />
    </svg>
  );
}

export default StaticLaptop;
