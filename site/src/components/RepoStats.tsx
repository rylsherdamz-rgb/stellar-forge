"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Download, Package } from "lucide-react";

const GITHUB = "https://github.com/rylsherdamz-rgb/stellar-forge";
const NPM = "https://www.npmjs.com/package/create-stellar-agentic";

const FALLBACK = { stars: 15, weekly: 82, total: 1564 };

export function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function useRepoStats() {
  const [stats, setStats] = useState(FALLBACK);
  useEffect(() => {
    let alive = true;
    const fetchJson = (url: string) =>
      fetch(url)
        .then((r) => r.json())
        .catch(() => null);
    (async () => {
      const end = new Date().toISOString().slice(0, 10);
      const [gh, weekly, yearly] = await Promise.all([
        fetchJson("https://api.github.com/repos/rylsherdamz-rgb/stellar-forge"),
        fetchJson("https://api.npmjs.org/downloads/point/last-week/create-stellar-agentic"),
        fetchJson(`https://api.npmjs.org/downloads/range/2015-01-10:${end}/create-stellar-agentic`),
      ]);
      if (!alive) return;
      const lifetime =
        yearly?.downloads && Array.isArray(yearly.downloads)
          ? yearly.downloads.reduce(
              (sum: number, d: { downloads?: number }) => sum + (d.downloads ?? 0),
              0,
            )
          : null;
      setStats({
        stars: typeof gh?.stargazers_count === "number" ? gh.stargazers_count : FALLBACK.stars,
        weekly: typeof weekly?.downloads === "number" ? weekly.downloads : FALLBACK.weekly,
        total: typeof lifetime === "number" ? lifetime : FALLBACK.total,
      });
    })();
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}

function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

function Stat({
  icon: Icon,
  value,
  label,
  href,
}: {
  icon: typeof Star;
  value: number;
  label: string;
  href?: string;
}) {
  const n = useCountUp(value);
  const inner = (
    <>
      <Icon size={16} aria-hidden="true" />
      <div>
        <span className="stat-value">{formatNum(n)}</span>
        <span className="stat-label">{label}</span>
      </div>
    </>
  );
  return href ? (
    <a className="stat" href={href} target="_blank" rel="noreferrer" aria-label={`${label}: ${formatNum(value)}`}>
      {inner}
    </a>
  ) : (
    <div className="stat">{inner}</div>
  );
}

export function StarButton() {
  const { stars } = useRepoStats();
  return (
    <a className="nav-star" href={GITHUB} target="_blank" rel="noreferrer" aria-label={`Star on GitHub — ${formatNum(stars)} stars`}>
      <Star size={13} fill="currentColor" aria-hidden="true" />
      Star
      <span className="nav-star-count">{formatNum(stars)}</span>
    </a>
  );
}

export default function StatsBar() {
  const { stars, weekly, total } = useRepoStats();
  return (
    <div className="stats-bar" aria-label="Project statistics">
      <Stat icon={Star} value={stars} label="GitHub Stars" href={GITHUB} />
      <Stat icon={Download} value={weekly} label="npm Weekly Downloads" href={NPM} />
      <Stat icon={Package} value={total} label="npm Total Downloads" href={NPM} />
    </div>
  );
}