"use client";
// Spec 071: inicializa el reporte de errores del navegador (sin NEXT_PUBLIC_SENTRY_DSN no hace nada). No pinta nada.
import { initMonitoring } from "@/lib/monitoring";

initMonitoring();

export function MonitoringInit() {
  return null;
}
