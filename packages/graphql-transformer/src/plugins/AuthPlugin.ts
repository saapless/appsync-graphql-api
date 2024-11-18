import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, InterfaceNode, ObjectNode } from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class AuthPlugin extends TransformerPluginBase {
  public readonly name = "AuthPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document.addNode(
      DirectiveDefinitionNode.create("auth", ["OBJECT", "FIELD_DEFINITION", "INTERFACE"])
    );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      if (definition.hasDirective("auth")) {
        return true;
      }

      return definition.fields?.some((field) => field.hasDirective("auth")) ?? false;
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
