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
import { KeyOperator, KeyValue, RelationType } from "../utils/types";
import { TransformerPluginBase } from "./TransformerPluginBase";

export type DirectiveArgs = {
  relation?: RelationType;
  key?: KeyValue<string>;
  sortKey?: (KeyValue<string> & KeyOperator<string>) | null;
  index?: string | null;
};

export type FieldConnection = Required<DirectiveArgs> & {
  target: ObjectNode | InterfaceNode | UnionNode;
};

export class ConnectionPlugin extends TransformerPluginBase {
  public readonly name = "ConnectionPlugin";
  constructor(context: TransformerContext) {
    super(context);
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
    const input = InputObjectNode.create("ModelIntFilterInput", [
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

  private _getConnectionTarget(field: FieldNode) {
    const fieldType = this.context.document.getNode(field.type.getTypeName());

    if (field.hasDirective("hasOne") || field.hasDirective("hasMany")) {
      return fieldType;
    }

    return undefined;
  }

  private _getFieldConnection(field: FieldNode): FieldConnection | null {
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

    let directive = field.getDirective("hasOne");

    if (directive) {
      if (field.hasDirective("hasMany")) {
        throw new TransformPluginExecutionError(
          this.name,
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        relation: "oneToOne",
        target: target,
        key: args.key ?? {
          ref: `source.${camelCase(target.name, "id")}`,
        },
        sortKey: args.sortKey ?? null,
        index: args.index ?? null,
      };
    }

    directive = field.getDirective("hasMany");

    if (directive) {
      if (field.hasDirective("hasOne")) {
        throw new TransformPluginExecutionError(
          this.name,
          `Multiple connection directive detected for field: ${field.name}`
        );
      }

      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        relation: args.relation ?? "oneToMany",
        target: target,
        key: args.key ?? {
          ref: "source.id",
        },
        sortKey: args.sortKey ?? null,
        index: args.index ?? "bySourceId",
      };
    }

    throw new TransformPluginExecutionError(
      this.name,
      `Could not find connection directive: ${field.name}`
    );
  }

  private _setConnectionArguments(
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
          isPrivate ? DirectiveNode.create("serverOnly") : DirectiveNode.create("writeOnly"),
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

  private _createFilterInput(model: ObjectNode | InterfaceNode | UnionNode) {
    const filterInputName = pascalCase(model.name, "filter", "input");
    let filterInput = this.context.document.getNode(filterInputName);

    if (filterInput && !(filterInput instanceof InputObjectNode)) {
      throw new TransformPluginExecutionError(
        this.name,
        `Type ${filterInputName} is not an input type`
      );
    }

    if (!filterInput) {
      filterInput = InputObjectNode.create(filterInputName);

      const fields: Map<string, FieldNode> = new Map();

      if (model instanceof UnionNode) {
        fields.set("__typename", FieldNode.create("__typename", NamedTypeNode.create("String")));

        for (const type of model.types ?? []) {
          const typeDef = this.context.document.getNode(type.getTypeName());

          if (!typeDef) {
            throw new TransformPluginExecutionError(
              this.name,
              `Unknown type ${type.getTypeName()}`
            );
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
        if (
          field.hasDirective("writeOnly") ||
          field.hasDirective("serverOnly") ||
          field.hasDirective("clientOnly")
        ) {
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

  private _createConnectionTypes(field: FieldNode, connection: FieldConnection) {
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
          FieldNode.create("cursor", NamedTypeNode.create("String"), null, [
            DirectiveNode.create("clientOnly"),
          ]),
          FieldNode.create("node", NamedTypeNode.create(target.name), null, [
            DirectiveNode.create("clientOnly"),
          ]),
        ]);

        if (connection.relation === "manyToMany") {
          edgeType
            .addField(
              FieldNode.create("id", NamedTypeNode.create("ID"), null, [
                DirectiveNode.create("serverOnly"),
              ])
            )
            .addField(
              FieldNode.create("_sk", NamedTypeNode.create("ID"), null, [
                DirectiveNode.create("serverOnly"),
              ])
            )
            .addField(
              FieldNode.create("sourceId", NamedTypeNode.create("ID"), null, [
                DirectiveNode.create("writeOnly"),
              ])
            )
            .addField(
              FieldNode.create("targetId", NamedTypeNode.create("ID"), null, [
                DirectiveNode.create("writeOnly"),
              ])
            );
        }

        this.context.document.addNode(connectionType).addNode(edgeType);
      }

      this._setConnectionArguments(field, target);
      field.setType(NonNullTypeNode.create(typeName));
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

    this.context.loader.setFieldLoader(edgeName, "node", {
      targetName: connection.target.name,
      dataSource: this.context.dataSources.primaryDataSourceName,
      action: {
        type: "getItem",
        key: { id: { ref: "source.nodeId" } },
      },
      returnType: "result",
    });

    this.context.loader.setFieldLoader("Mutation", createFieldName, {
      targetName: edgeName,
      action: { type: "putItem", key: {} },
      returnType: "edges",
    });

    this.context.loader.setFieldLoader("Mutation", deleteFieldName, {
      targetName: edgeName,
      action: { type: "removeItem", key: {} },
      returnType: "result",
    });
  }

  private _createNodeConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    this.context.loader.setFieldLoader(parent.name, field.name, {
      typeName: parent.name,
      fieldName: field.name,
      targetName: connection.target.name,
      action: {
        type: "getItem",
        key: { id: connection.key },
        index: connection.index ?? undefined,
      },
    });
  }

  private _createEdgesConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    this._createConnectionTypes(field, connection);

    if (connection.relation === "oneToMany") {
      this.context.loader.setFieldLoader(parent.name, field.name, {
        targetName: connection.target.name,
        action: {
          type: "queryItems",
          key: { sourceId: connection.key },
          index: connection.index ?? undefined,
        },
        returnType: "connection",
        dataSource: this.context.dataSources.primaryDataSourceName,
      });
    } else {
      this._createEdgeMutations(connection);

      const { target } = connection;
      const connectionTypeName = pascalCase(target.name, "connection");

      this.context.loader.setFieldLoader(parent.name, field.name, {
        targetName: target.name,
        dataSource: this.context.dataSources.primaryDataSourceName,
        action: {
          type: "queryItems",
          key: {
            sourceId: connection.key,
            _sk: { beginsWith: { eq: pascalCase(target.name, "Edge") } },
          },
          index: connection.index ?? undefined,
        },
        returnType: "connection",
      });

      this.context.loader.setFieldLoader(connectionTypeName, "edges", {
        dataSource: this.context.dataSources.primaryDataSourceName,
        action: {
          type: "batchGetItems",
          key: { keys: { ref: "source.edgeKeys" } },
        },
      });
    }
  }

  public before() {
    this.context.document
      .addNode(
        InputObjectNode.create("KeyValueInput", [
          InputValueNode.create("ref", NamedTypeNode.create("String")),
          InputValueNode.create("eq", NamedTypeNode.create("String")),
        ])
      )
      .addNode(
        InputObjectNode.create("SortKeyInput", [
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
        ])
      )
      .addNode(EnumNode.create("ConnectionRelationType", ["oneToMay", "manyToMany"]))
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
      const connection = this._getFieldConnection(field);

      if (!connection) {
        continue;
      }

      if (connection.relation === "oneToOne" && connection.key.ref?.startsWith("source")) {
        this._setConnectionKey(definition, connection.key.ref);
      }

      if (connection.relation === "oneToMany") {
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
        "Definition does not have any fields. Make sure you run match before calling execute()."
      );
    }

    for (const field of definition.fields) {
      const connection = this._getFieldConnection(field);

      if (!connection) {
        continue;
      }

      if (connection.relation === "oneToOne") {
        this._createNodeConnection(definition, field, connection);
        continue;
      }

      this._createEdgesConnection(definition, field, connection);
    }
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    for (const field of definition.fields ?? []) {
      if (field.hasDirective("hasOne")) {
        field.removeDirective("hasOne");
      }

      if (field.hasDirective("hasMany")) {
        field.removeDirective("hasMany");
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode("hasOne")
      .removeNode("hasMany")
      .removeNode("KeyValueInput")
      .removeNode("SortKeyInput")
      .removeNode("ConnectionRelationType");
  }

  static create(context: TransformerContext) {
    return new ConnectionPlugin(context);
  }
}
