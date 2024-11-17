import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, ObjectNode } from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class AuthPlugin extends TransformerPluginBase {
  public readonly name = "AuthPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document.addNode(
      DirectiveDefinitionNode.create("auth", ["OBJECT", "FIELD_DEFINITION"])
    );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode && definition.hasDirective("auth")) {
      return true;
    }

    return false;
  }

  public execute() {
    return;
  }

  static create(context: TransformerContext) {
    return new AuthPlugin(context);
  }
}
