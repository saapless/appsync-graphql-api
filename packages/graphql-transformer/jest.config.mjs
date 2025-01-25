import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */

const config = {
  ...createDefaultEsmPreset({ tsconfig: "../../tsconfig.json", useESM: true }),
};

export default config;
