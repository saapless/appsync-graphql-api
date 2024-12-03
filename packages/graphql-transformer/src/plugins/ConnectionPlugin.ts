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

export type SortKeyType = {
  eq?: string;
  le?: string;
  lt?: string;
  ge?: string;
  gt?: string;
  between?: string[];
  beginsWith?: string;
};

export type DirectiveArgs = {
  relation?: RelationType;
  key?: string;
  ref?: string;
  sk?: SortKeyType | null;
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
        InputObjectNode.create("SortKeyInput", [
          InputValueNode.create("ne", NamedTypeNode.create("String")),
          InputValueNode.create("eq", NamedTypeNode.create("String")),
          InputValueNode.create("le", NamedTypeNode.create("String")),
          InputValueNode.create("lt", NamedTypeNode.create("String")),
          InputValueNode.create("ge", NamedTypeNode.create("String")),
          InputValueNode.create("gt", NamedTypeNode.create("String")),
          InputValueNode.create("between", ListTypeNode.create(NonNullTypeNode.create("String"))),
          InputValueNode.create("beginsWith", NamedTypeNode.create("String")),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "connection",
          ["FIELD_DEFINITION", "OBJECT"],
          [
            InputValueNode.create("relation", "ConnectionRelationType"),
            InputValueNode.create("key", "String"),
            InputValueNode.create("ref", "String"),
            InputValueNode.create("sk", "SortKeyInput"),
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

  private _isConnectionType(node: ObjectNode | InterfaceNode | UnionNode) {
    if (node instanceof UnionNode) return false;
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
      const ref = args.ref ?? `source.${key}`;

      return {
        name: "node",
        relation: "oneOne",
        key: key,
        ref: ref,
        sk: args.sk ?? null,
        index: args.index ?? null,
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
        sk: args.sk ?? null,
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
        sk: args.sk ?? null,
        index: args.index ?? "bySourceId",
        target: target,
      };
    }

    return {
      name: null,
      relation: "oneOne",
      key: "sourceId",
      ref: "source.id",
      sk: null,
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

  private _createFilterInput(model: ObjectNode | InterfaceNode | UnionNode) {
    const filterInputName = pascalCase(model.name, "filter", "input");
    let filterInput = this.context.document.getNode(filterInputName);

    if (filterInput && !(filterInput instanceof InputObjectNode)) {
      throw new InvalidDefinitionError(`Type ${filterInputName} is not an input type`);
    }

    if (!filterInput) {
      filterInput = InputObjectNode.create(filterInputName);

      const fields: Map<string, FieldNode> = new Map();

      if (model instanceof UnionNode) {
        fields.set("__typename", FieldNode.create("__typename", NamedTypeNode.create("String")));

        for (const type of model.types ?? []) {
          const typeDef = this.context.document.getNode(type.getTypeName());

          if (!typeDef) {
            throw new InvalidDefinitionError(`Unknown type ${type.getTypeName()}`);
          }

          if (typeDef instanceof ObjectNode || typeDef instanceof InterfaceNode) {
            for (const field of typeDef.fields ?? []) {
              fields.set(field.name, field);
            }
          }
        }
      } else {
        for (const field of model.fields ?? []) {
          fields.set(field.name, field);
        }
      }

      for (const field of fields.values()) {
        if (field.hasDirective("writeonly") || field.hasDirective("private")) {
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

  private _setEdgesConnectionArguments(
    field: FieldNode,
    target: ObjectNode | InterfaceNode | UnionNode
  ) {
    if (!field.hasArgument("filter")) {
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
      field.addArgument(InputValueNode.create("sort", NamedTypeNode.create("ModelSortDirection")));
    }
  }

  /**
   * For one-to-many connections user should be able to add the connection key via mutations.
   * By default the connection key is writeonly meaning we only add it to the mutation inputs.
   */

  private _setConnectionKey(
    node: ObjectNode | InterfaceNode,
    key: string,
    isPrivate: boolean = false
  ) {
    if (!node.hasField(key)) {
      node.addField(
        FieldNode.create(key, NamedTypeNode.create("ID"), null, [
          isPrivate ? DirectiveNode.create("private") : DirectiveNode.create("writeonly"),
        ])
      );
    }
  }

  private _createNodeConnection(parent: ObjectNode | InterfaceNode, field: FieldNode) {
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
    connection: FieldConnection
  ) {
    const { target } = connection;

    if (!this._isConnectionType(target)) {
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

    if (connection.relation === "manyMany") {
      // TODO: Create edge mutations
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
      if (definition.name === "Mutation") return false;
      if (this._isConnectionType(definition) || this._isEdgeType(definition)) return false;
      if (!definition.fields?.length) return false;

      return true;
    }

    return false;
  }

  public normalize(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      const connection = this._getFieldConnection(field);

      if (!connection) {
        continue;
      }

      if (connection.name === "node") {
        field
          .removeDirective("node")
          .addDirective(
            DirectiveNode.create("connection", [
              ArgumentNode.create("relation", ValueNode.enum(connection.relation)),
              ArgumentNode.create("key", ValueNode.string(connection.key)),
              ArgumentNode.create("ref", ValueNode.string(connection.ref)),
              ArgumentNode.create("sk", ValueNode.null()),
              ArgumentNode.create(
                "index",
                connection.index ? ValueNode.string(connection.index) : ValueNode.null()
              ),
            ])
          );
      }

      if (connection.name === "edges") {
        field
          .removeDirective("edges")
          .addDirective(
            DirectiveNode.create("connection", [
              ArgumentNode.create("relation", ValueNode.enum(connection.relation)),
              ArgumentNode.create("key", ValueNode.string(connection.key)),
              ArgumentNode.create("ref", ValueNode.string(connection.ref)),
              ArgumentNode.create("sk", ValueNode.null()),
              ArgumentNode.create(
                "index",
                connection.index ? ValueNode.string(connection.index) : ValueNode.null()
              ),
            ])
          );
      }

      if (connection.relation === "oneOne") {
        if (connection.ref.startsWith("source")) {
          this._setConnectionKey(definition, connection.key);
        }
      }

      if (connection.relation === "oneMany") {
        if (connection.target instanceof UnionNode) {
          for (const type of connection.target.types ?? []) {
            const unionType = this.context.document.getNode(type.getTypeName());

            if (unionType instanceof ObjectNode || unionType instanceof InterfaceNode) {
              this._setConnectionKey(
                unionType,
                connection.key,
                !connection.ref.startsWith("source")
              );
            }
          }
        } else {
          this._setConnectionKey(
            connection.target,
            connection.key,
            !connection.ref.startsWith("source")
          );
        }
      }
    }
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

      this._createEdgesConnection(definition, field, connection);
    }
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      if (field.hasDirective("connection")) {
        field.removeDirective("connection");
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode("node")
      .removeNode("edges")
      .removeNode("connection")
      .removeNode("ignoreConnection")
      .removeNode("ConnectionRelationType")
      .removeNode("SortKeyInput");
  }

  static create(context: TransformerContext) {
    return new ConnectionPlugin(context);
  }
}
