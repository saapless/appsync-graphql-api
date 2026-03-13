import path from "node:path";
import { createTransformer, definitionFromSource } from "@saapless/graphql-transformer";
import { SchemaGenerator, ModelTypesGenerator } from "@saapless/graphql-transformer/generators";

const __dirname = new URL(".", import.meta.url).pathname;

(() => {
  const definition = definitionFromSource(path.resolve(__dirname, "todos-schema.graphql"));

  const transformer = createTransformer({
    definition,
    outDir: path.resolve(__dirname, "../generated"),
    plugins: [SchemaGenerator, ModelTypesGenerator],
  });

  const startTime = Date.now();
  console.log("Transforming schema...");
  transformer.transform();
  console.log("Done!" + ` (${Date.now() - startTime}ms)`);
})();
