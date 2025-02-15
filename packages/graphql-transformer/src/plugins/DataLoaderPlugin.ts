import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

/**
 * For each object, traverse the fields and add loaders based on connection directive
 * For Query field add loaders based on connection directive;
 * For mutation fields add loaders
 */

export class DataLoaderPlugin extends TransformerPluginBase {
  public readonly name = "DataLoaderPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(
        DirectiveDefinitionNode.create("dataSource", "OBJECT", [
          InputValueNode.create("name", NonNullTypeNode.create("String")),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("resolver", "FIELD_DEFINITION", [
          InputValueNode.create("name", NonNullTypeNode.create("String")),
          InputValueNode.create("dataSource", NamedTypeNode.create("String")),
          InputValueNode.create("pipeline", ListTypeNode.create("String")),
        ])
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return definition.fields?.some((field) => field.hasDirective("resolver")) ?? false;
    }

    return false;
  }

  public execute(definition: ObjectNode | InterfaceNode) {
    if (definition.fields) {
      for (const field of definition.fields) {
        if (field.hasDirective("resolver")) {
          // generate resolver for definition

          field.removeDirective("resolver");
        }
      }
    }
  }

  public cleanup(): void {
    this.context.document.removeNode("dataSource").removeNode("resolver");
  }

  static create(context: TransformerContext) {
    return new DataLoaderPlugin(context);
  }
}
