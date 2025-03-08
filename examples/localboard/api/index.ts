import { createTransformer } from "@saapless/graphql-transformer";
import { ExecutableSchemaGenerator } from "@saapless/graphql-transformer/plugins";
import { readFileSync } from "node:fs";
import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const definition = readFileSync(path.resolve(__dirname, "./schema.graphql"), "utf8");

const transformer = createTransformer({
  definition: definition,
  outDir: path.resolve(__dirname, "../__generated__"),
  plugins: [ExecutableSchemaGenerator],
});

transformer.transform();
