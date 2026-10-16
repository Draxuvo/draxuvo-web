import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";

export default defineConfig({
  plugins: [
    // ISR de la portada (planes, 1 h): caché de datos en Workers KV (plan gratuito).
    vinext({ cache: { data: kvDataAdapter() } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
