import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Matches #RGB, #RGBA, #RRGGBB and #RRGGBBAA anywhere in a string.
const HEX_COLOUR = "/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\\b/";
const NO_HEX_MESSAGE =
  "Use a palette token (bg-primary, text-muted, border-line…) instead of a hex colour. Colours live in src/theme/palettes.ts.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Palette switching only works if components never hard-code colours.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/theme/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${HEX_COLOUR}]`, message: NO_HEX_MESSAGE },
        { selector: `TemplateElement[value.raw=${HEX_COLOUR}]`, message: NO_HEX_MESSAGE },
        { selector: `JSXText[value=${HEX_COLOUR}]`, message: NO_HEX_MESSAGE },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
