"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type CategoryChipsProps = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

// Fichas «Todo» + una por categoría; se desplazan en horizontal en teléfonos angostos.
export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const t = useTranslations("menu");
  const options: { key: string | null; label: string }[] = [
    { key: null, label: t("all") },
    ...categories.map((name) => ({ key: name, label: name })),
  ];

  return (
    <nav aria-label={t("categories")} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-2 py-1">
        {options.map((option) => {
          const active = option.key === selected;
          return (
            <li key={option.key ?? "__all"}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(option.key)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-tinta bg-tinta text-etiqueta"
                    : "border-anaquel-borde bg-etiqueta text-tinta hover:border-tinta",
                )}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
