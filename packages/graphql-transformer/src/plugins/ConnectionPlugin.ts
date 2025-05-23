import { ConnectionDirective, RelationType, ScalarType, UtilityDirective } from "../constants";
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
  InputObjectNode,
} from "../definition";
import { TransformPluginExecutionError } from "../utils/errors";
import { camelCase, pascalCase } from "../utils/strings";
import { KeyOperator, KeyValue } from "../utils/types";
import { TransformerPluginBase } from "./PluginBase";

type Relation = (typeof RelationType)[keyof typeof RelationType];

export type DirectiveArgs = {
  relation?: Relation;
  key?: KeyValue<string>;
  sortKey?: (KeyValue<string> & KeyOperator<string>) | null;
  index?: string | null;
};

export type FieldConnection = Required<DirectiveArgs> & {
  target: ObjectNode | InterfaceNode | UnionNode;
};

export class ConnectionPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("ConnectionPlugin", context);
  }

  // #region Model Resources

  private _createSizeFilterInput() {
    const input = InputObjectNode.create("SizeFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("Int")),
      InputValueNode.create("eq", NamedTypeNode.create("Int")),
      InputValueNode.create("le", NamedTypeNode.create("Int")),
      InputValueNode.create("lt", NamedTypeNode.create("Int")),
      InputValueNode.create("ge", NamedTypeNode.create("Int")),
      InputValueNode.create("gt", NamedTypeNode.create("Int")),
      InputValueNode.create("between", ListTypeNode.create(NonNullTypeNode.create("Int"))),
    ]);

    this.context.document.addNode(input);
  }

  private _createStringFilterInput() {
    const input = InputObjectNode.create("StringFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("String")),
      InputValueNode.create("eq", NamedTypeNode.create("String")),
      InputValueNode.create("le", NamedTypeNode.create("String")),
      InputValueNode.create("lt", NamedTypeNode.create("String")),
      InputValueNode.create("ge", NamedTypeNode.create("String")),
      InputValueNode.create("gt", NamedTypeNode.create("String")),
      InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("String"))),
      InputValueNode.create("contains", NamedTypeNode.create("String")),
      InputValueNode.create("notContains", NamedTypeNode.create("String")),
      InputValueNode.create("between", ListTypeNode.create(NonNullTypeNode.create("String"))),
      InputValueNode.create("beginsWith", NamedTypeNode.create("String")),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
      InputValueNode.create("size", NamedTypeNode.create("SizeFilterInput")),
    ]);

    this.context.document.addNode(input);
  }

  private _createIntFilterInput() {
    const input = InputObjectNode.create("IntFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("Int")),
      InputValueNode.create("eq", NamedTypeNode.create("Int")),
      InputValueNode.create("le", NamedTypeNode.create("Int")),
      InputValueNode.create("lt", NamedTypeNode.create("Int")),
      InputValueNode.create("ge", NamedTypeNode.create("Int")),
      InputValueNode.create("gt", NamedTypeNode.create("Int")),
      InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("Int"))),
      InputValueNode.create("between", ListTypeNode.create(NonNullTypeNode.create("Int"))),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createFloatFilterInput() {
    const input = InputObjectNode.create("FloatFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("Float")),
      InputValueNode.create("eq", NamedTypeNode.create("Float")),
      InputValueNode.create("le", NamedTypeNode.create("Float")),
      InputValueNode.create("lt", NamedTypeNode.create("Float")),
      InputValueNode.create("ge", NamedTypeNode.create("Float")),
      InputValueNode.create("gt", NamedTypeNode.create("Float")),
      InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("Float"))),
      InputValueNode.create("between", ListTypeNode.create(NonNullTypeNode.create("Float"))),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createBooleanFilterInput() {
    const input = InputObjectNode.create("BooleanFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("Boolean")),
      InputValueNode.create("eq", NamedTypeNode.create("Boolean")),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createIDFilterInput() {
    const input = InputObjectNode.create("IDFilterInput", [
      InputValueNode.create("ne", NamedTypeNode.create("ID")),
      InputValueNode.create("eq", NamedTypeNode.create("ID")),
      InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("ID"))),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createListFilterInput() {
    const input = InputObjectNode.create("ListFilterInput", [
      InputValueNode.create("contains", NamedTypeNode.create("String")),
      InputValueNode.create("notContains", NamedTypeNode.create("String")),
      InputValueNode.create("size", NamedTypeNode.create("SizeFilterInput")),
    ]);

    this.context.document.addNode(input);
  }

  private _createSortDirection() {
    const enumNode = EnumNode.create("SortDirection", ["ASC", "DESC"]);
    this.context.document.addNode(enumNode);
  }

  // #endregion Model Resources

  private _isConnectionType(node: ObjectNode | InterfaceNode | UnionNode) {
    if (node instanceof UnionNode || node instanceof InterfaceNode) return false;
    if (!node.name.endsWith("Connection")) return false;
    if (!node.fields || node.fields.length < 2) return false;
    if (!node.hasField("edges") || !node.hasField("pageInfo")) return false;
    return true;
  }

  private _isEdgeType(node: ObjectNode | InterfaceNode) {
    if (!node.name.endsWith("Edge")) return false;
    if (!node.fields || node.fields.length < 2) return false;
    if (!node.hasField("node") || !node.hasField("cursor")) return false;
    return true;
  }

  private _getConnectionTarget(field: FieldNode) {
    const fieldType = this.context.document.getNode(field.type.getTypeName());

    if (
      field.hasDirective(ConnectionDirective.HAS_ONE) ||
      field.hasDirective(ConnectionDirective.HAS_MANY)
    ) {
      return fieldType;
    }

    return undefined;
  }

  private _getFieldConnection(
    object: ObjectNode | InterfaceNode,
    field: FieldNode
  ): FieldConnection | null {
    const target = this._getConnectionTarget(field);

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

    let directive = field.getDirective(ConnectionDirective.HAS_ONE);

    if (directive) {
      if (field.hasDirective(ConnectionDirective.HAS_MANY)) {
        throw new TransformPluginExecutionError(
          this.name,
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        relation: RelationType.ONE_TO_ONE,
        target: target,
        key: args.key ?? { ref: `source.${camelCase(target.name, "id")}` },
        sortKey: args.sortKey ?? null,
        index: args.index ?? null,
      };
    }

    directive = field.getDirective(ConnectionDirective.HAS_MANY);

    if (directive) {
      const args = directive.getArgumentsJSON<DirectiveArgs>();

      let sortKey = args.sortKey;

      if (!sortKey && !args.key && !args.relation && object.name !== "Query") {
        sortKey = { beginsWith: { eq: target.name } };
      }

      return {
        relation: args.relation ?? RelationType.ONE_TO_MANY,
        target: target,
        key: args.key ?? { ref: "source.id" },
        sortKey: sortKey ?? null,
        index: args.index ?? "bySourceId",
      };
    }

    throw new TransformPluginExecutionError(
      this.name,
      `Could not find connection directive: ${field.name}`
    );
  }

  private _setConnectionArguments(field: FieldNode, target: ObjectNode) {
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
      field.addArgument(InputValueNode.create("sort", NamedTypeNode.create("SortDirection")));
    }
  }

  /**
   * For one-to-many connections user should be able to add the connection key via mutations.
   * By default the connection key is _writeOnly_ meaning we only add it to the mutation inputs.
   */

  private _setConnectionKey(
    node: ObjectNode | InterfaceNode,
    key: string,
    isPrivate: boolean = false
  ) {
    if (!node.hasField(key)) {
      node.addField(
        FieldNode.create(key, NamedTypeNode.create("ID"), null, [
          isPrivate
            ? DirectiveNode.create(UtilityDirective.SERVER_ONLY)
            : DirectiveNode.create(UtilityDirective.WRITE_ONLY),
        ])
      );
    }
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

  private _createFilterInput(target: ObjectNode) {
    const filterInputName = pascalCase(target.name, "filter", "input");
    let filterInput = this.context.document.getNode(filterInputName);

    if (filterInput && !(filterInput instanceof InputObjectNode)) {
      throw new TransformPluginExecutionError(
        this.name,
        `Type ${filterInputName} is not an input type`
      );
    }

    if (!filterInput) {
      filterInput = InputObjectNode.create(filterInputName);

      for (const field of target.fields ?? []) {
        if (
          field.hasDirective(UtilityDirective.WRITE_ONLY) ||
          field.hasDirective(UtilityDirective.SERVER_ONLY) ||
          field.hasDirective(UtilityDirective.CLIENT_ONLY)
        ) {
          continue;
        }

        switch (field.type.getTypeName()) {
          case ScalarType.ID:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create(`IDFilterInput`))
            );
            continue;
          case ScalarType.INT:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("IntFilterInput"))
            );
            continue;
          case ScalarType.FLOAT:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("FloatFilterInput"))
            );
            continue;
          case ScalarType.BOOLEAN:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("BooleanFilterInput"))
            );
            continue;
          case ScalarType.STRING:
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
              InputValueNode.create(field.name, NamedTypeNode.create("StringFilterInput"))
            );
            continue;
        }

        const typeDef = this.context.document.getNode(field.type.getTypeName());

        if (!typeDef) {
          throw new TransformPluginExecutionError(
            this.name,
            `Unknown type ${field.type.getTypeName()}`
          );
        }

        if (typeDef instanceof EnumNode) {
          this._createEnumFilterInput(typeDef);

          filterInput.addField(
            InputValueNode.create(
              field.name,
              NamedTypeNode.create(pascalCase(typeDef.name, "filter", "input"))
            )
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

  private _needsEdgeRecord(connection: FieldConnection) {
    if (connection.relation === RelationType.MANY_TO_MANY) return true;
    if (
      connection.relation === RelationType.ONE_TO_MANY &&
      (connection.target instanceof UnionNode || connection.target instanceof InterfaceNode)
    )
      return true;
    return false;
  }

  private _createConnectionTypes(field: FieldNode, connection: FieldConnection) {
    const { target } = connection;

    if (!this._isConnectionType(target)) {
      const connectionTypeName = pascalCase(target.name, "connection");
      const edgeTypeName = pascalCase(target.name, "edge");
      const hasEdgeRecord = this._needsEdgeRecord(connection);

      let connectionType = this.context.document.getNode(connectionTypeName) as ObjectNode;
      let edgeType = this.context.document.getNode(edgeTypeName) as ObjectNode;

      if (!connectionType) {
        connectionType = ObjectNode.create(connectionTypeName, [
          FieldNode.create(
            "edges",
            NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create(edgeTypeName)))
          ),
          FieldNode.create("pageInfo", NonNullTypeNode.create("PageInfo")),
        ]);

        this.context.document.addNode(connectionType);
      }

      if (!edgeType) {
        edgeType = ObjectNode.create(`${target.name}Edge`, [
          FieldNode.create("cursor", NamedTypeNode.create("String"), null, [
            DirectiveNode.create(UtilityDirective.CLIENT_ONLY),
          ]),
          FieldNode.create("node", NamedTypeNode.create(target.name), null, [
            DirectiveNode.create(UtilityDirective.CLIENT_ONLY),
          ]),
        ]);

        this.context.document.addNode(edgeType);
      }

      if (this._needsEdgeRecord(connection)) {
        if (!connectionType.hasField("keys")) {
          connectionType.addField(
            FieldNode.create("keys", ListTypeNode.create(NonNullTypeNode.create("ID")), null, [
              DirectiveNode.create(UtilityDirective.SERVER_ONLY),
            ])
          );
        }

        if (!edgeType.hasField("id")) {
          edgeType.addField(
            FieldNode.create("id", NonNullTypeNode.create("ID"), null, [
              DirectiveNode.create(UtilityDirective.SERVER_ONLY),
            ])
          );
        }

        if (!edgeType.hasField("sourceId")) {
          edgeType.addField(
            FieldNode.create("sourceId", NonNullTypeNode.create("ID"), null, [
              DirectiveNode.create(UtilityDirective.WRITE_ONLY),
            ])
          );
        }

        if (!edgeType.hasField("targetId")) {
          edgeType.addField(
            FieldNode.create("targetId", NonNullTypeNode.create("ID"), null, [
              DirectiveNode.create(UtilityDirective.WRITE_ONLY),
            ])
          );
        }

        if (!edgeType.hasField("createdAt")) {
          edgeType.addField(
            FieldNode.create("createdAt", NonNullTypeNode.create("AWSDateTime"), null, [
              DirectiveNode.create(UtilityDirective.FILTER_ONLY),
            ])
          );
        }

        if (!edgeType.hasField("updatedAt")) {
          edgeType.addField(
            FieldNode.create("updatedAt", NonNullTypeNode.create("AWSDateTime"), null, [
              DirectiveNode.create(UtilityDirective.FILTER_ONLY),
            ])
          );
        }

        // Edges should not extend Node interface but should share fields.

        const nodeFields = (this.context.document.getNode("Node") as InterfaceNode)?.fields ?? [];

        for (const field of nodeFields) {
          if (!edgeType.hasField(field.name)) {
            edgeType.addField(FieldNode.fromDefinition(field.serialize()));
          }
        }
      }

      this._setConnectionArguments(field, hasEdgeRecord ? edgeType : (target as ObjectNode));
      field.setType(NonNullTypeNode.create(connectionTypeName));
    }
  }

  private _createEdgeMutations(connection: FieldConnection) {
    const edgeName = pascalCase(connection.target.name, "edge");
    const edgeInputName = pascalCase(edgeName, "input");
    const createFieldName = camelCase("create", edgeName);
    const deleteFieldName = camelCase("delete", edgeName);

    if (!this.context.document.hasNode(edgeInputName)) {
      this.context.document.addNode(
        InputObjectNode.create(edgeInputName, [
          InputValueNode.create("sourceId", NonNullTypeNode.create("ID")),
          InputValueNode.create("targetId", NonNullTypeNode.create("ID")),
        ])
      );
    }

    const mutationNode = this.context.document.getMutationNode();

    if (!mutationNode.hasField(createFieldName)) {
      mutationNode.addField(
        FieldNode.create(createFieldName, NamedTypeNode.create(edgeName), [
          InputValueNode.create("input", NonNullTypeNode.create(edgeInputName)),
        ])
      );
    }

    if (!mutationNode.hasField(deleteFieldName)) {
      mutationNode.addField(
        FieldNode.create(deleteFieldName, NamedTypeNode.create(edgeName), [
          InputValueNode.create("input", NonNullTypeNode.create(edgeInputName)),
        ])
      );
    }

    this.context.resolvers.setLoader(edgeName, "node", {
      targetName: connection.target.name,
      operation: {
        type: "get",
        key: { ref: "source.targetId" },
      },
      checkEarlyReturn: true,
      returnType: "result",
    });

    this.context.resolvers.setLoader("Mutation", createFieldName, {
      targetName: edgeName,
      isEdge: true,
      operation: { type: "create", key: {} },
      returnType: "result",
    });

    this.context.resolvers.setLoader("Mutation", deleteFieldName, {
      targetName: edgeName,
      isEdge: true,
      operation: { type: "delete", key: {} },
      returnType: "result",
    });
  }

  private _createNodeConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    if (parent instanceof ObjectNode) {
      this.context.resolvers.setLoader(parent.name, field.name, {
        typeName: parent.name,
        fieldName: field.name,
        targetName: connection.target.name,
        returnType: "result",
        operation: {
          type: "get",
          key: connection.key,
          index: connection.index ?? undefined,
        },
      });
    }
  }

  private _createEdgesConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    this._createConnectionTypes(field, connection);

    // We need to transformer the connections for interface fields
    // but they should not load data directly.

    if (parent instanceof InterfaceNode) {
      return;
    }

    if (connection.relation === "oneToMany" && !this._needsEdgeRecord(connection)) {
      this.context.resolvers.setLoader(parent.name, field.name, {
        targetName: connection.target.name,
        operation: {
          type: "query",
          key: connection.key,
          sortKey: connection.sortKey ?? undefined,
          index: connection.index ?? undefined,
        },
        returnType: "connection",
      });
    } else {
      this._createEdgeMutations(connection);

      const { target } = connection;
      const connectionTypeName = pascalCase(target.name, "connection");
      const edgeTypeName = pascalCase(target.name, "edge");

      this.context.resolvers.setLoader(parent.name, field.name, {
        targetName: target.name,
        isEdge: true,
        operation: {
          type: "query",
          key: connection.key,
          sortKey: { beginsWith: { eq: edgeTypeName } },
          index: connection.index ?? undefined,
        },
        returnType: "connection",
      });

      this.context.resolvers.setLoader(connectionTypeName, "edges", {
        targetName: target.name,
        operation: {
          type: "batchGet",
          key: { ref: "source.keys" },
        },
        checkEarlyReturn: true,
        returnType: "edges",
      });
    }
  }

  public before() {
    this.context.document
      .addNode(
        InputObjectNode.create(
          "KeyValueInput",
          [
            InputValueNode.create("ref", NamedTypeNode.create("String")),
            InputValueNode.create("eq", NamedTypeNode.create("String")),
          ],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        InputObjectNode.create(
          "SortKeyInput",
          [
            InputValueNode.create("ref", NamedTypeNode.create("String")),
            InputValueNode.create("eq", NamedTypeNode.create("String")),
            InputValueNode.create("ne", NamedTypeNode.create("KeyValueInput")),
            InputValueNode.create("le", NamedTypeNode.create("KeyValueInput")),
            InputValueNode.create("lt", NamedTypeNode.create("KeyValueInput")),
            InputValueNode.create("ge", NamedTypeNode.create("KeyValueInput")),
            InputValueNode.create("gt", NamedTypeNode.create("KeyValueInput")),
            InputValueNode.create(
              "between",
              ListTypeNode.create(NonNullTypeNode.create("KeyValueInput"))
            ),
            InputValueNode.create("beginsWith", NamedTypeNode.create("KeyValueInput")),
          ],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        EnumNode.create(
          "ConnectionRelationType",
          ["oneToMay", "manyToMany"],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create("hasOne", "FIELD_DEFINITION", [
          InputValueNode.create("key", "KeyValueInput"),
          InputValueNode.create("sortKey", "SortKeyInput"),
          InputValueNode.create("index", "String"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("hasMany", "FIELD_DEFINITION", [
          InputValueNode.create("relation", "ConnectionRelationType"),
          InputValueNode.create("key", "KeyValueInput"),
          InputValueNode.create("sortKey", "SortKeyInput"),
          InputValueNode.create("index", "String"),
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

    this._createSizeFilterInput();
    this._createStringFilterInput();
    this._createIntFilterInput();
    this._createFloatFilterInput();
    this._createBooleanFilterInput();
    this._createIDFilterInput();
    this._createListFilterInput();
    this._createSortDirection();
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
      const connection = this._getFieldConnection(definition, field);

      if (!connection) {
        continue;
      }

      if (
        connection.relation === RelationType.ONE_TO_ONE &&
        connection.key.ref?.startsWith("source.")
      ) {
        const key = connection.key.ref.split(".")[1];
        this._setConnectionKey(definition, key);
      }

      if (connection.relation === RelationType.ONE_TO_MANY) {
        if (connection.target instanceof UnionNode) {
          for (const type of connection.target.types ?? []) {
            const unionType = this.context.document.getNode(type.getTypeName());

            if (unionType instanceof ObjectNode || unionType instanceof InterfaceNode) {
              this._setConnectionKey(unionType, "sourceId", false);
            }
          }
        } else {
          this._setConnectionKey(connection.target, "sourceId", false);
        }
      }
    }
  }

  public execute(definition: ObjectNode | InterfaceNode) {
    if (!definition.fields) {
      throw new TransformPluginExecutionError(
        this.name,
        "Definition does not have any fields. Make sure you run `match` before calling `execute`."
      );
    }

    for (const field of definition.fields) {
      const connection = this._getFieldConnection(definition, field);

      if (!connection) {
        continue;
      }

      if (connection.relation === RelationType.ONE_TO_ONE) {
        this._createNodeConnection(definition, field, connection);
      } else {
        this._createEdgesConnection(definition, field, connection);
      }
    }
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      if (field.hasDirective(ConnectionDirective.HAS_ONE)) {
        field.removeDirective(ConnectionDirective.HAS_ONE);
      }

      if (field.hasDirective(ConnectionDirective.HAS_MANY)) {
        field.removeDirective(ConnectionDirective.HAS_MANY);
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode(ConnectionDirective.HAS_ONE)
      .removeNode(ConnectionDirective.HAS_MANY)
      .removeNode("KeyValueInput")
      .removeNode("SortKeyInput")
      .removeNode("ConnectionRelationType");
  }

  static create(context: TransformerContext) {
    return new ConnectionPlugin(context);
  }
}
