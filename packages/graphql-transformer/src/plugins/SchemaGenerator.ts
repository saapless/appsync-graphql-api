import path from "node:path";
import { TransformerContext } from "../context";
import { printFile } from "../utils";
import { TransformerPluginBase } from "./PluginBase";

export class SchemaGenerator extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("SchemaGenerator", context);
  }

  public match(): boolean {
    return false;
  }

  public execute(): void {
    return;
  }

  public generate(): void {
    printFile(
      path.resolve(this.context.outputDirectory, "schema.graphql"),
      this.context.document.print()
    );
  }

  public static create(context: TransformerContext) {
    return new SchemaGenerator(context);
  }
}
