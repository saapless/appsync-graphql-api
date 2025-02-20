import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, InterfaceNode, ObjectNode } from "../definition";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class UtilitiesPlugin extends TransformerPluginBase {
  readonly name = "UtilitiesPlugin";

  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(DirectiveDefinitionNode.create("readOnly", ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create("writeOnly", ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create("serverOnly", ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create("clientOnly", ["FIELD_DEFINITION"]));
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return true;
    }

    return false;
  }

  public execute(): void {}

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      if (field.hasDirective("readOnly")) {
        field.removeDirective("readOnly");
      }

      if (field.hasDirective("clientOnly")) {
        field.removeDirective("clientOnly");
      }

      if (field.hasDirective("writeOnly")) {
        definition.removeField(field.name);
      }

      if (field.hasDirective("serverOnly")) {
        definition.removeField(field.name);
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode("readOnly")
      .removeNode("writeOnly")
      .removeNode("serverOnly")
      .removeNode("clientOnly");
  }

  static create(context: TransformerContext): UtilitiesPlugin {
    return new UtilitiesPlugin(context);
  }
}
