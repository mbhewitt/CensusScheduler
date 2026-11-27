// Flat config (ESLint 9). Replaces the legacy .eslintrc.json; `next lint` no longer exists in Next 16.
// eslint-config-next already registers the react / react-hooks / import / jsx-a11y / @next plugins,
// so they are not re-declared here.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierRecommended, // eslint-plugin-prettier + eslint-config-prettier
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
    rules: {
      "@typescript-eslint/no-use-before-define": "error",
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: ["prevColumnItem", "res"],
        },
      ],
      "sort-imports": [
        "error",
        { ignoreDeclarationSort: true, ignoreCase: true },
      ],
      "import/order": [
        "error",
        {
          alphabetize: { caseInsensitive: true, order: "asc" },
          groups: ["builtin", "external", "internal"],
          "newlines-between": "always",
          pathGroups: [
            { group: "internal", pattern: "lib/**" },
            { group: "internal", pattern: "src/**" },
          ],
          pathGroupsExcludedImportTypes: [],
        },
      ],
      "react/function-component-definition": [
        "error",
        { namedComponents: "arrow-function" },
      ],
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    },
  },
];

// Pre-existing violations (lint was broken for a long time, see #509/#417). Downgraded to
// "warn" so CI can gate on new *errors* without a mass reformat; tighten back to "error"
// once each is cleaned up (most are auto-fixable with `yarn lint:fix`).
const downgraded = [
  "prettier/prettier",
  "import/order",
  "sort-imports",
  "no-param-reassign",
  "@typescript-eslint/no-use-before-define",
  "react/jsx-no-useless-fragment",
  // new React Compiler rules shipped with eslint-plugin-react-hooks 7 (eslint-config-next 16)
  "react-hooks/refs",
  "react-hooks/set-state-in-effect",
  "react-hooks/preserve-manual-memoization",
  "react-hooks/immutability",
];

export default [
  ...eslintConfig,
  {
    // Applied last so they override severities set above and in the Next presets.
    rules: Object.fromEntries(downgraded.map((r) => [r, "warn"])),
  },
];
