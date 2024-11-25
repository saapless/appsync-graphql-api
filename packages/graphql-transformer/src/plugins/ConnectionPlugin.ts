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
  DirectiveNode,
  ArgumentNode,
  ValueNode,
  InputObjectNode,
} from "../parser";
import { FieldResolver } from "../resolver";
import { InvalidDefinitionError, TransformPluginExecutionError } from "../utils/errors";
import { camelCase, pascalCase } from "../utils/strings";
import { TransformerPluginBase } from "./TransformerPluginBase";

export type RelationType = "oneOne" | "oneMany" | "manyOne" | "manyMany";
export type ConnectionDirectiveName = "node" | "edges" | "connection";

export type DirectiveArgs = {
  relation?: RelationType;
  key?: string;
  ref?: string;
  index?: string | null;
};

export type FieldConnection = Required<DirectiveArgs> & {
  name: ConnectionDirectiveName | null;
  target: ObjectNode | InterfaceNode | UnionNode;
};

/**
 * **Directives:**
 * * `@connection(relation: ConnectionRelationType!, key: String, ref: String, index: String)`
 *    - Creates a connection field based on input;
 * * `@node(key: String, ref: String, index: String)`
 *    - Shorthand for a one-to-one connection;
 *    - Automatically implied if field references a Node type);
 * * `@edges(key: String, ref: String, index: String)` - Creates a one-to-many connection;
 *    - Shorthand for a one-to-many connection;
 *
 * **Relation types:**
 * * `oneOne` - a one-to-one connection;
 *    - Defaults:
 *      - key: `<targetName>Id` - key is added to source node inputs;
 *      - ref: `source.<key>` - `source` represents source object;
 *      - index: `<no index>` - Retrieves from primary table;
 * * `oneMany` - a one-to-many connection;
 *    - Defaults:
 *      - key: `sourceId` - added to target Node input;
 *      - ref: `source.id` - `source` represents source object
 *      - index: `bySourceId`
 * * `manyMany` -  a many-to-many connection: ! Creates edge records;
 *    - Defaults:
 *      - key: `<TargetName>Edge#sourceId#targetId` - composite key;
 *      - ref: `source.id` & `target.id`;
 *      - index: `byTypename`;
 *
 * **Reference:** - maps to value in the context. Examples:
 * * `source.id`
 * * `identity.claims.sub`
 * * `args.input.id`
 */

export class ConnectionPlugin extends TransformerPluginBase {
  public readonly name = "ConnectionPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(EnumNode.create("ConnectionRelationType", ["oneOne", "oneMany", "manyMany"]))
      .addNode(
        DirectiveDefinitionNode.create(
          "connection",
          ["FIELD_DEFINITION", "OBJECT"],
          [
            InputValueNode.create("relation", "ConnectionRelationType"),
            InputValueNode.create("key", "String"),
            InputValueNode.create("ref", "String"),
            InputValueNode.create("index", "String"),
          ]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create("node", "FIELD_DEFINITION", [
          InputValueNode.create("key", "String"),
          InputValueNode.create("ref", "String"),
          InputValueNode.create("index", "String"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("edges", "FIELD_DEFINITION", [
          InputValueNode.create("key", "String"),
          InputValueNode.create("ref", "String"),
          InputValueNode.create("index", "String"),
        ])
      )
      .addNode(DirectiveDefinitionNode.create("ignoreConnection", "FIELD_DEFINITION"))
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

  private _isEdgeType(node: ObjectNode | InterfaceNode) {
    if (!node.fields) return false;
    if (node.fields.length !== 2) return false;
    if (!node.hasField("node") || !node.hasField("cursor")) return false;
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

    if (fieldType instanceof ObjectNode || fieldType instanceof InterfaceNode) {
      if (
        fieldType.name === "Node" ||
        fieldType.hasDirective("model") ||
        fieldType.hasInterface("Node")
      ) {
        return fieldType;
      }
    }

    if (fieldType instanceof UnionNode && this._isUnionOfNodes(fieldType)) {
      return fieldType;
    }

    return undefined;
  }

  private _getFieldConnection(field: FieldNode): FieldConnection | null {
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

    let directive = field.getDirective("node");

    if (directive) {
      if (field.hasDirective("edges") || field.hasDirective("connection")) {
        throw new InvalidDefinitionError(
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();
      const key = args.key ?? camelCase(target.name, "id");

      return {
        name: "node",
        relation: "oneOne",
        key: args.key ?? camelCase(target.name, "id"),
        ref: `source.${key}`,
        index: null,
        target: target,
      };
    }

    directive = field.getDirective("edges");

    if (directive) {
      if (field.hasDirective("node") || field.hasDirective("connection")) {
        throw new InvalidDefinitionError(
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        name: "edges",
        relation: "oneMany",
        key: args.key ?? "sourceId",
        ref: args.ref ?? "source.id",
        index: args.index ?? "bySourceId",
        target: target,
      };
    }

    directive = field.getDirective("connection");

    if (directive) {
      if (field.hasDirective("node") || field.hasDirective("edges")) {
        throw new InvalidDefinitionError(
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        name: "connection",
        relation: args.relation ?? "oneMany",
        key: args.key ?? "sourceId",
        ref: args.ref ?? "source.id",
        index: args.index ?? "bySourceId",
        target: target,
      };
    }

    return {
      name: null,
      relation: "oneOne",
      key: "sourceId",
      ref: "source.id",
      index: null,
      target: target,
    };
  }

  private _createEnumFilterInput(node: EnumNode) {
    const filterInputName = pascalCase(node.name, "filter", "input");

    if (!this.context.document.hasNode(filterInputName)) {
      const input = InputObjectNode.create(filterInputName, [
        InputValueNode.create("eq", NamedTypeNode.create(node.name)),
        InputValueNode.create("ne", NamedTypeNode.create(node.name)),
        InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create(node.name))),
        InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
      ]);

      this.context.document.addNode(input);
    }
  }

  private _createFilterInput(model: ObjectNode | InterfaceNode) {
    const filterInputName = pascalCase(model.name, "filter", "input");
    let filterInput = this.context.document.getNode(filterInputName);

    if (filterInput && !(filterInput instanceof InputObjectNode)) {
      throw new InvalidDefinitionError(`Type ${filterInputName} is not an input type`);
    }

    if (!filterInput) {
      filterInput = InputObjectNode.create(filterInputName);

      for (const field of model.fields ?? []) {
        if (field.hasDirective("writeonly") || field.hasDirective("ignore")) {
          continue;
        }

        switch (field.type.getTypeName()) {
          case "ID":
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create(`ModelIDInput`))
            );
            continue;
          case "Int":
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("ModelIntInput"))
            );
            continue;
          case "Float":
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("ModelFloatInput"))
            );
            continue;
          case "Boolean":
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("ModelBooleanInput"))
            );
            continue;
          case "String":
          case "AWSDate":
          case "AWSDateTime":
          case "AWSTime":
          case "AWSTimestamp":
          case "AWSEmail":
          case "AWSJSON":
          case "AWSURL":
          case "AWSPhone":
          case "AWSIPAddress":
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("ModelStringInput"))
            );
            continue;
        }

        const typeDef = this.context.document.getNode(field.type.getTypeName());

        if (!typeDef) {
          throw new InvalidDefinitionError(`Unknown type ${field.type.getTypeName()}`);
        }

        if (typeDef instanceof EnumNode) {
          this._createEnumFilterInput(typeDef);

          filterInput.addField(
            InputValueNode.create(field.name, NamedTypeNode.create(`${typeDef.name}Input`))
          );
        }

        // TODO: handle nested objects filtering
      }

      filterInput.addField(InputValueNode.create("and", ListTypeNode.create(filterInputName)));
      filterInput.addField(InputValueNode.create("or", ListTypeNode.create(filterInputName)));
      filterInput.addField(InputValueNode.create("not", NamedTypeNode.create(filterInputName)));

      this.context.document.addNode(filterInput);
    }

    return filterInput;
  }

  /**
   * TODO: handle union type filter
   */

  private _setEdgesConnectionArguments(
    field: FieldNode,
    target: ObjectNode | InterfaceNode | UnionNode
  ) {
    if (!field.hasArgument("filter") && !(target instanceof UnionNode)) {
      const filterInput = this._createFilterInput(target);
      field.addArgument(InputValueNode.create("filter", NamedTypeNode.create(filterInput.name)));
    }

    if (!field.hasArgument("first")) {
      field.addArgument(InputValueNode.create("first", NamedTypeNode.create("Int")));
    }

    if (!field.hasArgument("after")) {
      field.addArgument(InputValueNode.create("after", NamedTypeNode.create("String")));
    }

    if (!field.hasArgument("sort")) {
      field.addArgument(
        InputValueNode.create(
          "sort",
          ListTypeNode.create(NonNullTypeNode.create("ModelSortDirection"))
        )
      );
    }
  }

  private _createNodeConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    if (connection.name === "node") {
      field
        .removeDirective("node")
        .addDirective(
          DirectiveNode.create("connection", [
            ArgumentNode.create("relation", ValueNode.enum(connection.relation)),
            ArgumentNode.create("key", ValueNode.string(connection.key)),
            ArgumentNode.create("ref", ValueNode.string(connection.ref)),
            ArgumentNode.create(
              "index",
              connection.index ? ValueNode.string(connection.index) : ValueNode.null()
            ),
          ])
        );
    }

    if (!parent.hasField(connection.key)) {
      parent.addField(
        FieldNode.create(connection.key, NamedTypeNode.create("ID")).addDirective(
          DirectiveNode.create("writeonly")
        )
      );
    }

    if (!this.context.resolvers.has(`${parent.name}.${field.name}`)) {
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
      const typeName = pascalCase(target.name, "connection");

      if (!this.context.document.hasNode(typeName)) {
        const connectionType = ObjectNode.create(typeName, [
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

      this._setEdgesConnectionArguments(field, target);
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
      if (definition.name === "Query" || definition.name === "Mutation") {
        return false;
      }

      const fields = definition.fields;

      if (!fields) return false;
      if (this._isConnectionType(definition) || this._isEdgeType(definition)) return false;
      return true;
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
        this._createNodeConnection(definition, field, connection);
        continue;
      }

      this._createEdgesConnection(definition, field, connection.target);
    }
  }

  static create(context: TransformerContext) {
    return new ConnectionPlugin(context);
  }
}
