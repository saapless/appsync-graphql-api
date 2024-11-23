/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */

const config = {
  preset: "ts-jest/presets/default-esm",
  verbose: true,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "./tsconfig.eslint.json",
      },
    ],
  },
  projects: ["<rootDir>/packages/*"],
};

export default config;
