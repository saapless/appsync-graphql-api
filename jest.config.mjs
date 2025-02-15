import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */

const config = {
  verbose: true,
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testEnvironment: "node",
  projects: ["<rootDir>/packages/*"],
  extensionsToTreatAsEsm: [".ts"],
  ...createDefaultEsmPreset({ tsconfig: "<rootDir>/tsconfig.json", useESM: true }),
};

export default config;
