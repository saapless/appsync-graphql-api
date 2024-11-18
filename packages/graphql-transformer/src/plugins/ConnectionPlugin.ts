import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  EnumNode,
  InputValueNode,
  InterfaceNode,
  ObjectNode,
  FieldNode,
  UnionNode,
  NonNullTypeNode,
  ListTypeNode,
  NamedTypeNode,
} from "../parser";
import { FieldResolver } from "../resolver";
import { TransformPluginExecutionError } from "../utils/errors";
import { TransformerPluginBase } from "./TransformerPluginBase";

export type RelationType = "oneOne" | "oneMany" | "manyOne" | "manyMany";

export class ConnectionPlugin extends TransformerPluginBase {
  public readonly name = "ConnectionPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(
        EnumNode.create("ConnectionRelationType", ["oneOne", "oneMany", "manyOne", "manyMany"])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "connection",
          ["FIELD_DEFINITION", "OBJECT"],
          [InputValueNode.create("relation", "ConnectionRelationType")]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create("node", "FIELD_DEFINITION", [
          InputValueNode.create("key", "String"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("edges", "FIELD_DEFINITION", [
          InputValueNode.create("key", "String"),
          InputValueNode.create("relation", "ConnectionRelationType"),
        ])
      )
      .addNode(
        ObjectNode.create("PageInfo", [
          FieldNode.create("hasNextPage", NamedTypeNode.create("Boolean")),
          FieldNode.create("hasPreviousPage", NamedTypeNode.create("Boolean")),
          FieldNode.create("startCursor", NamedTypeNode.create("String")),
          FieldNode.create("endCursor", NamedTypeNode.create("String")),
        ])
      );
  }

  private _isUnionOfNodes(node: UnionNode) {
    if (!node.types) return false;
    return node.types.every((type) => {
      const nodeType = this.context.document.getNode(type.getTypeName());
      if (!nodeType) return false;
      if (nodeType instanceof InterfaceNode) return nodeType.name === "Node";
      if (nodeType instanceof ObjectNode)
        return nodeType.hasDirective("model") || nodeType.hasInterface("Node");
      return false;
    });
  }

  private _isConnectionType(node: ObjectNode | InterfaceNode) {
    if (!node.fields) return false;
    if (node.fields.length !== 2) return false;
    if (!node.hasField("edges") || !node.hasField("pageInfo")) return false;
    return true;
  }

  private _getFieldConnectionTarget(field: FieldNode) {
    const fieldType = this.context.document.getNode(field.type.getTypeName());

    if (
      field.hasDirective("connection") ||
      field.hasDirective("node") ||
      field.hasDirective("edges")
    ) {
      return fieldType;
    }

    if (fieldType instanceof ObjectNode) {
      if (fieldType.hasDirective("model") || fieldType.hasInterface("Node")) {
        return fieldType;
      }
    }

    if (fieldType instanceof InterfaceNode) {
      if (fieldType.name === "Node" || fieldType.hasInterface("Node")) {
        return fieldType;
      }
    }

    if (fieldType instanceof UnionNode && this._isUnionOfNodes(fieldType)) {
      return fieldType;
    }

    return undefined;
  }

  private _getFieldConnection(field: FieldNode): {
    relation: RelationType;
    key: string;
    target: ObjectNode | InterfaceNode | UnionNode;
  } | null {
    const target = this._getFieldConnectionTarget(field);

    if (!target) return null;

    if (
      !(target instanceof ObjectNode) &&
      !(target instanceof InterfaceNode) &&
      !(target instanceof UnionNode)
    ) {
      throw new TransformPluginExecutionError(
        this.name,
        `Type ${target.name} is not a valid connection target.`
      );
    }

    const directive =
      field.getDirective("node") ?? field.getDirective("edges") ?? field.getDirective("connection");

    if (directive) {
      const args = directive.getArgumentsJSON<{ key: string; relation: RelationType }>();

      return {
        key: args.key ?? "sourceId",
        relation: directive.name === "node" ? "oneOne" : (args.relation ?? "oneMany"),
        target: target,
      };
    }

    return {
      key: "sourceId",
      relation: "oneOne",
      target: target,
    };
  }

  private _createNodeConnection(parent: ObjectNode | InterfaceNode, field: FieldNode) {
    if (!this.context.resolvers.has(`${ObjectNode.name}.${field.name}`)) {
      this.context.resolvers.set(
        `${parent.name}.${field.name}`,
        FieldResolver.create(parent.name, field.name)
      );
    }
  }

  private _createEdgesConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    target: ObjectNode | InterfaceNode | UnionNode
  ) {
    if (target instanceof UnionNode || !this._isConnectionType(target)) {
      const typeName = `${target.name}Connection`;

      if (!this.context.document.hasNode(typeName)) {
        const connectionType = ObjectNode.create(`${target.name}Connection`, [
          FieldNode.create(
            "edges",
            NonNullTypeNode.create(
              ListTypeNode.create(NonNullTypeNode.create(`${target.name}Edge`))
            )
          ),
          FieldNode.create("pageInfo", NonNullTypeNode.create("PageInfo")),
        ]);

        const edgeType = ObjectNode.create(`${target.name}Edge`, [
          FieldNode.create("cursor", NamedTypeNode.create("String")),
          FieldNode.create("node", NamedTypeNode.create(target.name)),
        ]);

        this.context.document.addNode(connectionType).addNode(edgeType);
      }

      field.setType(NonNullTypeNode.create(typeName));
    }

    if (!this.context.resolvers.has(`${ObjectNode.name}.${field.name}`)) {
      this.context.resolvers.set(
        `${parent.name}.${field.name}`,
        FieldResolver.create(parent.name, field.name)
      );
    }
  }

  public match(definition: DefinitionNode): boolean {
    if (definition instanceof InterfaceNode || definition instanceof ObjectNode) {
      const fields = definition.fields;
      if (!fields) return false;

      for (const field of fields) {
        if (this._getFieldConnectionTarget(field)) {
          return true;
        }
      }
    }

    return false;
  }

  public execute(definition: ObjectNode | InterfaceNode) {
    if (!definition.fields) {
      throw new TransformPluginExecutionError(
        this.name,
        "Definition does not have any fields. Make sure you run match before calling execute()."
      );
    }

    for (const field of definition.fields) {
      const connection = this._getFieldConnection(field);

      if (!connection) {
        continue;
      }

      if (connection.relation === "oneOne") {
        this._createNodeConnection(definition, field);
        continue;
      }

      this._createEdgesConnection(definition, field, connection.target);
    }
  }

  static create(context: TransformerContext) {
    return new ConnectionPlugin(context);
  }
}
