import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  InputValueNode,
  InterfaceNode,
  NonNullTypeNode,
  ObjectNode,
} from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class DataLoaderPlugin extends TransformerPluginBase {
  public readonly name = "DataLoaderPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document.addNode(
      DirectiveDefinitionNode.create(
        "dataSource",
        "OBJECT",
        InputValueNode.create("source", NonNullTypeNode.create("String"))
      )
    );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return true;
    }

    return false;
  }

  public execute() {
    return;
  }

  static create(context: TransformerContext) {
    return new DataLoaderPlugin(context);
  }
}
