import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Browser-side code must not reach into server-only modules (see "Conventions" in the README).
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/app/**/page.tsx",
      "src/app/appShell.tsx",
      "src/core/controllers/**/*.ts",
      "src/core/services/client/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/src/lib/server/*", "**/lib/server/*"], message: "Server-only code cannot be imported from browser code." },
          { group: ["@/src/core/services/server/*", "**/services/server/*"], message: "Call the API through core/services/client instead." },
          { group: ["@/src/core/repositories/*", "**/repositories/*"], message: "Repositories are server-only." },
        ],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
