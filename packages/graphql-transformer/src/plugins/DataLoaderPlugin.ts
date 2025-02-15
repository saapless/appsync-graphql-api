import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
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

  private _generateMutationLoader(field: FieldNode) {
    const fieldName = field.name;
    // const typeName = field.type.getTypeName();
    const resolver = this.context.resolvers.get(`Mutation.${fieldName}`);

    if (resolver && !resolver.isReadonly) {
      // resolver.addImport("@aws-appsync/utils", "util");
    }
  }

  // private _generateQueryLoader(field: FieldNode) {
  //   const fieldName = field.name;
  //   const typeName = field.type.getTypeName();
  // }

  // private _generateConnectionLoader(source: ObjectNode | InterfaceNode, field: FieldNode) {
  //   // const fieldName = field.name;
  //   // const typeName = field.type.getTypeName();
  // }

  public before() {
    this.context.document
      .addNode(
        DirectiveDefinitionNode.create("dataSource", "OBJECT", [
          InputValueNode.create("name", NonNullTypeNode.create("String")),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("resolver", "FIELD_DEFINITION", [
          InputValueNode.create("source", NonNullTypeNode.create("String")),
        ])
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return true;
    }

    return false;
  }

  public execute(definition: ObjectNode | InterfaceNode) {
    for (const field of definition.fields ?? []) {
      const fieldResolver = this.context.resolvers.get(`${definition.name}.${field.name}`);

      if (fieldResolver?.isReadonly) {
        continue;
      }

      // if (definition.name === "Mutation") {
      //   this._generateMutationLoader(field);
      // } else if (definition.name === "Query") {
      //   this._generateQueryLoader(field);
      // } else if (field.hasDirective("connection")) {
      //   this._generateConnectionLoader(definition, field);
      // }
    }
  }

  public cleanup(): void {
    this.context.document.removeNode("dataSource").removeNode("resolver");
  }

  static create(context: TransformerContext) {
    return new DataLoaderPlugin(context);
  }
}
