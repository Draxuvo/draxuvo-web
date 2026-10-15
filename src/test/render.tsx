import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

const MESSAGES = { es, en };

export type TestLocale = keyof typeof MESSAGES;

// Pinta con los mensajes reales del sitio (es por defecto) y zona horaria UTC.
export function renderWithProviders(ui: ReactElement, locale: TestLocale = "es"): RenderResult {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>,
  );
}
