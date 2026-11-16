import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  {
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        crypto: "readonly",
        Intl: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  globalIgnores(["dist/**", "node_modules/**", "src/vendor/**"]),
]);

export default eslintConfig;
