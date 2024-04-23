import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [sitemap(), tailwind(), expressiveCode(), mdx(), pagefind()],
});
