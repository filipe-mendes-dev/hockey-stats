import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/next-env.d.ts",
    "**/messages/*.d.json.ts",
    "output/**",
    ".playwright-cli/**",
  ]),
]);
