"use client";

import ScreenApp from "@/components/screen/ScreenApp";
import type { Beat } from "@/lib/scroll-bus";

export default function MobileLaptop({ beat }: { beat: Beat }) {
  return (
    <div className="mobile-laptop">
      <div className="ml-lid">
        <div className="ml-screen">
          <div className="ml-screen-inner">
            <ScreenApp beat={beat} />
          </div>
        </div>
      </div>
      <div className="ml-deck">
        <div className="ml-hinge" aria-hidden />
        <div className="ml-keys" aria-hidden>
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="ml-trackpad" aria-hidden />
      </div>
    </div>
  );
}