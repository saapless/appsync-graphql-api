import { TransformerContext } from "../context";
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
    this.context.printFile("schema.graphql", this.context.document.print());
  }

  public static create(context: TransformerContext) {
    return new SchemaGenerator(context);
  }
}
