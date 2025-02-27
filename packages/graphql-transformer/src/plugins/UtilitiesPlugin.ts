import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, InterfaceNode, ObjectNode } from "../definition";
import * as C from "../utils/constants";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class UtilitiesPlugin extends TransformerPluginBase {
  readonly name = "UtilitiesPlugin";

  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(DirectiveDefinitionNode.create(C.READ_ONLY_DIRECTIVE, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(C.WRITE_ONLY_DIRECTIVE, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(C.SERVER_ONLY_DIRECTIVE, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(C.CLIENT_ONLY_DIRECTIVE, ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create(C.FILTER_ONLY_DIRECTIVE, ["FIELD_DEFINITION"]));
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
      if (field.hasDirective(C.READ_ONLY_DIRECTIVE)) {
        field.removeDirective(C.READ_ONLY_DIRECTIVE);
      }

      if (field.hasDirective(C.CLIENT_ONLY_DIRECTIVE)) {
        field.removeDirective(C.CLIENT_ONLY_DIRECTIVE);
      }

      if (field.hasDirective(C.FILTER_ONLY_DIRECTIVE)) {
        definition.removeField(field.name);
      }

      if (field.hasDirective(C.WRITE_ONLY_DIRECTIVE)) {
        definition.removeField(field.name);
      }

      if (field.hasDirective(C.SERVER_ONLY_DIRECTIVE)) {
        definition.removeField(field.name);
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode(C.READ_ONLY_DIRECTIVE)
      .removeNode(C.WRITE_ONLY_DIRECTIVE)
      .removeNode(C.SERVER_ONLY_DIRECTIVE)
      .removeNode(C.CLIENT_ONLY_DIRECTIVE)
      .removeNode(C.FILTER_ONLY_DIRECTIVE);
  }

  static create(context: TransformerContext): UtilitiesPlugin {
    return new UtilitiesPlugin(context);
  }
}
