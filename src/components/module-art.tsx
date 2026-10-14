"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ModuleKey } from "@/lib/plans";

// Una ilustración SVG por módulo. La animación es CSS (globals.css, .art-*) y corre cuando la
// ilustración entra en vista; al tocarla (o con Enter) se repite. Sin animación queda en su
// estado final.
const S = { stroke: "var(--color-tinta)", strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const idx = (i: number) => ({ style: { "--i": i } as React.CSSProperties });

const ART: Record<ModuleKey, ReactNode> = {
  employees: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} className="art-slide" {...idx(i)}>
          <rect x={12 + i * 48} y={28} width={40} height={64} rx={4} fill={i === 1 ? "var(--color-ceja)" : "var(--color-etiqueta)"} {...S} />
          <circle cx={32 + i * 48} cy={50} r={9} fill="var(--color-anaquel)" {...S} />
          <path d={`M${20 + i * 48} 78h24`} {...S} />
        </g>
      ))}
    </>
  ),
  attendance: (
    <>
      <rect x={14} y={16} width={132} height={88} rx={4} fill="var(--color-etiqueta)" {...S} />
      <path d="M14 38h132" {...S} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const cx = 36 + (i % 3) * 44;
        const cy = 60 + Math.floor(i / 3) * 28;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={9} fill={i === 4 ? "var(--color-oferta)" : "var(--color-sello)"} className="art-pop" {...idx(i)} stroke="var(--color-tinta)" strokeWidth={2} />
            {i !== 4 && <path d={`M${cx - 4} ${cy}l3 3l6-6`} pathLength={1} className="art-draw" {...idx(i + 2)} fill="none" stroke="var(--color-etiqueta)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        );
      })}
    </>
  ),
  inventory: (
    <>
      <path d="M14 104h132" {...S} />
      {[44, 70, 30, 56].map((h, i) => (
        <rect key={i} x={22 + i * 32} y={104 - h} width={24} height={h} fill={i === 2 ? "var(--color-oferta)" : "var(--color-ceja)"} className="art-grow" {...idx(i)} {...S} />
      ))}
    </>
  ),
  work_orders: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={18} y={20 + i * 30} width={22} height={22} rx={3} fill="var(--color-etiqueta)" {...S} />
          <path d={`M24 ${31 + i * 30}l5 5l8-10`} pathLength={1} className="art-draw" {...idx(i * 2)} fill="none" stroke="var(--color-sello)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M52 ${31 + i * 30}h${70 - i * 12}`} className="art-slide" {...idx(i * 2)} {...S} />
        </g>
      ))}
    </>
  ),
  tickets: (
    <>
      <path d="M40 10h80v100l-10-8l-10 8l-10-8l-10 8l-10-8l-10 8l-10-8z" fill="var(--color-etiqueta)" {...S} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M54 ${32 + i * 16}h${52 - i * 10}`} className="art-slide" {...idx(i)} {...S} />
      ))}
      <rect x={54} y={78} width={52} height={12} fill="var(--color-ceja)" className="art-pop" {...idx(3)} {...S} />
    </>
  ),
  reports: (
    <>
      <path d="M14 104h132M14 16v88" {...S} />
      {[30, 48, 40, 66].map((h, i) => (
        <rect key={i} x={26 + i * 30} y={104 - h} width={20} height={h} fill="var(--color-ceja)" className="art-grow" {...idx(i)} {...S} />
      ))}
      <path d="M30 70l30-18l30 8l40-30" pathLength={1} className="art-draw" {...idx(4)} fill="none" stroke="var(--color-oferta)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M22 20h116a4 4 0 0 1 4 4v56a4 4 0 0 1-4 4H64l-22 20V84H22a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4z" fill="var(--color-sello)" className="art-pop" {...idx(0)} {...S} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={64 + i * 18} cy={52} r={5} fill="var(--color-etiqueta)" className="art-pop" {...idx(i + 2)} />
      ))}
    </>
  ),
  multi_company: (
    <>
      <path d="M80 60L36 92M80 60l44 32" pathLength={1} className="art-draw" {...idx(0)} fill="none" stroke="var(--color-tinta)" strokeWidth={3} strokeLinecap="round" />
      <rect x={58} y={16} width={44} height={44} rx={3} fill="var(--color-ceja)" className="art-pop" {...idx(1)} {...S} />
      <rect x={14} y={80} width={44} height={32} rx={3} fill="var(--color-etiqueta)" className="art-pop" {...idx(2)} {...S} />
      <rect x={102} y={80} width={44} height={32} rx={3} fill="var(--color-etiqueta)" className="art-pop" {...idx(3)} {...S} />
    </>
  ),
};

export function ModuleArt({ moduleKey, large = false }: { moduleKey: ModuleKey; large?: boolean }) {
  const t = useTranslations("modules");
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      data-play={seen}
      onClick={() => setRun((value) => value + 1)}
      aria-label={`${t(`artAlt.${moduleKey}`)}. ${t("replay")}`}
      className={`press block w-full rounded-etiqueta border-2 border-tinta bg-anaquel p-2 transition-colors duration-120 hover:bg-etiqueta ${large ? "max-w-[18rem]" : "max-w-[14rem]"}`}
    >
      <svg key={run} viewBox="0 0 160 120" role="img" aria-hidden="true" className="block h-auto w-full">
        {ART[moduleKey]}
      </svg>
    </button>
  );
}
