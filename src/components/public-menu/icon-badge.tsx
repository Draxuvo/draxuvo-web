import { isProductIconKey } from "@/lib/product-icons/catalog";
import { SHAPES } from "@/lib/product-icons/shapes";
import { categoryColor, type PublicMenuItem } from "@/lib/public-menu";
import { cn } from "@/lib/utils";

// Cuadro del color de la categoría con el icono del producto (spec 026) o, sin icono, la inicial. Decorativo.
// `large` llena el espacio de una foto que no cargó (spec 061, FR-016).
export function IconBadge({
  icon,
  name,
  category,
  large = false,
}: {
  icon: PublicMenuItem["icon"];
  name: string;
  category: string;
  large?: boolean;
}) {
  const size = large ? 56 : 24;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center text-etiqueta",
        large ? "size-full" : "size-11 rounded-etiqueta",
      )}
      style={{ backgroundColor: categoryColor(category) }}
    >
      {isProductIconKey(icon) ? (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          {SHAPES[icon].map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ) : (
        <span className={cn("font-semibold uppercase", large ? "text-4xl" : "text-lg")}>{name.trim().charAt(0)}</span>
      )}
    </span>
  );
}
