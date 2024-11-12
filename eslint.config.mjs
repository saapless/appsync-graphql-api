import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import securityPlugin from "eslint-plugin-security";
import pluginImport from "eslint-plugin-import";
import configPrettier from "eslint-config-prettier";
import pluginTurbo from "eslint-plugin-turbo";

export default tseslint.config(
  {
    ignores: ["**/*.(spec|test).(ts|tsx|js|jsx)$", "**/node_modules/**", "**/dist/**"],
    files: ["**/*.(ts|tsx|js|jsx|mjs)$"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      pluginImport.flatConfigs.recommended,
      pluginImport.flatConfigs.typescript,
      securityPlugin.configs.recommended,
      pluginTurbo.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
        },
      },
    },
    rules: {
      "import/order": [
        1,
        {
          groups: [
            "type",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
        },
      ],
    },
  },
  configPrettier
);
