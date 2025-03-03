import path from "node:path";
import { TransformerContext } from "../context";
import { printFile } from "../utils";
import { GeneratorPluginBase } from "./GeneratorBase";

export class SchemaGenerator extends GeneratorPluginBase {
  constructor(context: TransformerContext) {
    super("SchemaGenerator", context);
  }

  public generate(outDir: string): void {
    printFile(path.resolve(outDir, "schema.graphql"), this.context.document.print());
  }

  public static create(context: TransformerContext) {
    return new SchemaGenerator(context);
  }
}
