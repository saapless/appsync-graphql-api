import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  DirectiveNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  ObjectNode,
  ValueNode,
} from "../definition";
import { TransformerPluginBase } from "./PluginBase";

export const UtilityDirective = {
  SERVER_ONLY: "serverOnly",
  CLIENT_ONLY: "clientOnly",
  READ_ONLY: "readOnly",
  WRITE_ONLY: "writeOnly",
  FILTER_ONLY: "filterOnly",
  SEMANTIC_NON_NULL: "semanticNonNull",
  NON_NULL: "nonNull",
  INTERNAL: "internal",
} as const;

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
      .addNode(DirectiveDefinitionNode.create(UtilityDirective.FILTER_ONLY, ["FIELD_DEFINITION"]))
      .addNode(
        DirectiveDefinitionNode.create(
          UtilityDirective.SEMANTIC_NON_NULL,
          ["FIELD_DEFINITION"],
          InputValueNode.create(
            "levels",
            ListTypeNode.create("Int"),
            ValueNode.list([ValueNode.int(0)])
          )
        )
      )
      .addNode(
        InputObjectNode.create("NonNullOptionsInput", [
          InputValueNode.create("read", "Boolean"),
          InputValueNode.create("write", "Boolean"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          UtilityDirective.NON_NULL,
          ["FIELD_DEFINITION"],
          [
            InputValueNode.create("on", "NonNullOptionsInput"),
            InputValueNode.create(
              "levels",
              ListTypeNode.create("Int"),
              ValueNode.list([ValueNode.int(0)])
            ),
          ]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create(UtilityDirective.INTERNAL, [
          "FIELD_DEFINITION",
          "INPUT_FIELD_DEFINITION",
          "INTERFACE",
          "OBJECT",
          "INPUT_OBJECT",
          "ENUM",
        ])
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return true;
    }

    return false;
  }

  public normalize(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      if (field.hasDirective(UtilityDirective.NON_NULL)) {
        const levels = field.getDirective(UtilityDirective.NON_NULL)?.getArgument("levels");
        field.addDirective(
          DirectiveNode.create(UtilityDirective.SEMANTIC_NON_NULL, levels ? [levels] : undefined)
        );
      }
    }
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

      if (field.hasDirective(UtilityDirective.NON_NULL)) {
        field.removeDirective(UtilityDirective.NON_NULL);
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
      .removeNode(UtilityDirective.FILTER_ONLY)
      .removeNode(UtilityDirective.NON_NULL)
      .removeNode("NonNullOptionsInput")
      .removeNode(UtilityDirective.INTERNAL);
  }

  static create(context: TransformerContext): UtilitiesPlugin {
    return new UtilitiesPlugin(context);
  }
}
