import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow necessary setState in effects for hydration patterns
      "react-hooks/set-state-in-effect": "off",
      // Allow impure functions (Date.now) in memoized callbacks for stats
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
