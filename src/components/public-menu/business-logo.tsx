"use client";
import { useState } from "react";

/**
 * Logo del negocio en el encabezado del menú QR (spec 063, FR-018). La URL viene firmada y caduca; si no carga, se oculta
 * y el encabezado queda solo con el nombre, como antes.
 */
export function BusinessLogo({ url, name }: { url: string | null | undefined; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className="mb-3 h-16 w-auto max-w-[70%] object-contain object-left"
      onError={() => setFailedUrl(url)}
    />
  );
}
