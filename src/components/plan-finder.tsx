"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { Need } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const NEEDS: Need[] = ["work_orders", "tickets", "whatsapp", "multi_company"];

type PlanFinderProps = {
  needs: Need[];
  onToggle: (need: Need) => void;
  onClear: () => void;
  suggestedName: string | null;
};

// Casillas de necesidades. La sugerencia vive en PricingSection (suggestPlan); aquí solo se
// marca y se anuncia el resultado en una región aria-live.
export function PlanFinder({ needs, onToggle, onClear, suggestedName }: PlanFinderProps) {
  const t = useTranslations("finder");

  let message = t("empty");
  if (needs.length > 0) {
    message = suggestedName
      ? t("reason", { plan: suggestedName, needs: needs.map((need) => t(`needs.${need}`)).join("; ") })
      : t("noMatch");
  }

  return (
    <div className="mt-4">
      <fieldset>
        <legend className="font-display text-lg leading-none font-semibold uppercase">{t("title")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {NEEDS.map((need) => {
            const checked = needs.includes(need);
            return (
              <label key={need} className="cursor-pointer">
                <input type="checkbox" checked={checked} onChange={() => onToggle(need)} className="peer sr-only" />
                <span
                  className={cn(
                    "press inline-flex items-center gap-1.5 rounded-full border-2 border-tinta px-3 py-1.5 text-sm font-semibold transition-colors duration-120 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta",
                    checked ? "bg-tinta text-etiqueta" : "bg-etiqueta hover:bg-ceja",
                  )}
                >
                  {checked && <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />}
                  {t(`needs.${need}`)}
                </span>
              </label>
            );
          })}
          {needs.length > 0 && (
            <button type="button" onClick={onClear} className="draw-underline px-1 text-sm font-semibold">
              {t("clear")}
            </button>
          )}
        </div>
      </fieldset>
      <p aria-live="polite" className="mt-2 min-h-[1.5rem] text-sm font-medium">
        {message}
      </p>
    </div>
  );
}
