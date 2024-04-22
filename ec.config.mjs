import { defineEcConfig } from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

export default defineEcConfig({
  themes: ["one-dark-pro"],
  plugins: [pluginLineNumbers()],
  styleOverrides: {
    frames: {
      tooltipSuccessBackground: "hsl(140, 100%, 27%)",
    },
  },
});
