import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */

const config = {
  ...createDefaultEsmPreset(),
};

export default config;
