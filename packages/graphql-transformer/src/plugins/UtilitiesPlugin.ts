import { UtilityDirective } from "../constants";
import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, InterfaceNode, ObjectNode } from "../definition";
import { TransformerPluginBase } from "./PluginBase";

export class UtilitiesPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("UtilitiesPlugin", context);
  }

  public before() {
    this.context.document
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.READ_ONLY, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.WRITE_ONLY, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.SERVER_ONLY, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.CLIENT_ONLY, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.FILTER_ONLY, ["FIELD_DEFINITION"]));
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
      if (field.hasDirective(UtilityDirective.READ_ONLY)) {
        field.removeDirective(UtilityDirective.READ_ONLY);
      }

      if (field.hasDirective(UtilityDirective.CLIENT_ONLY)) {
        field.removeDirective(UtilityDirective.CLIENT_ONLY);
      }

      if (field.hasDirective(UtilityDirective.FILTER_ONLY)) {
        definition.removeField(field.name);
      }

      if (field.hasDirective(UtilityDirective.WRITE_ONLY)) {
        definition.removeField(field.name);
      }

      if (field.hasDirective(UtilityDirective.SERVER_ONLY)) {
        definition.removeField(field.name);
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode(UtilityDirective.READ_ONLY)
      .removeNode(UtilityDirective.WRITE_ONLY)
      .removeNode(UtilityDirective.SERVER_ONLY)
      .removeNode(UtilityDirective.CLIENT_ONLY)
      .removeNode(UtilityDirective.FILTER_ONLY);
  }

  static create(context: TransformerContext): UtilitiesPlugin {
    return new UtilitiesPlugin(context);
  }
}
