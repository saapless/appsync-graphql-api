import path from "node:path";
import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import securityPlugin from "eslint-plugin-security";
import pluginImport from "eslint-plugin-import";
import configPrettier from "eslint-config-prettier";
import pluginTurbo from "eslint-plugin-turbo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/out/**"],
    extends: [
      eslint.configs.recommended,
      // eslint-disable-next-line import/no-named-as-default-member
      ...tseslint.configs.recommended,
      pluginImport.flatConfigs.recommended,
      pluginImport.flatConfigs.typescript,
      securityPlugin.configs.recommended,
    ],
    plugins: {
      turbo: {
        rules: pluginTurbo.rules,
      },
    },
    languageOptions: {
      ecmaVersion: "latest",
      // eslint-disable-next-line import/no-named-as-default-member
      parser: tseslint.parser,
      parserOptions: {
        project: [
          path.join(__dirname, "tsconfig.json"),
          path.join(__dirname, "tsconfig.eslint.json"),
          path.join(__dirname, "packages/*/tsconfig.json"),
        ],
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: [
            "<rootDir>/tsconfig.json",
            "<rootDir>/tsconfig.eslint.json",
            "<rootDir>/packages/*/tsconfig.json",
          ],
        },
      },
    },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
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
  configPrettier,
  {
    files: ["**/*.(spec|test).(ts|tsx|js|jsx)$"],
    languageOptions: {
      globals: {
        jest: true,
      },
    },
  }
);
