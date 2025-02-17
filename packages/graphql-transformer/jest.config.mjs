import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDefaultEsmPreset } from "ts-jest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  ...createDefaultEsmPreset({
    tsconfig: path.resolve(__dirname, "../../tsconfig.json"),
    useESM: true,
  }),
};

export default config;
