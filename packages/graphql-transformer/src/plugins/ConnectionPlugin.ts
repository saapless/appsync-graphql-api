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
import { BuiltInScalar } from "../utils/constants";
import { TransformerPluginBase } from "./PluginBase";
import { UtilityDirective } from "./UtilitiesPlugin";

export const ConnectionDirective = {
  HAS_ONE: "hasOne",
  HAS_MANY: "hasMany",
} as const;

export const RelationType = {
  ONE_TO_ONE: "oneToOne",
  ONE_TO_MANY: "oneToMany",
  MANY_TO_MANY: "manyToMany",
} as const;

type Relation = (typeof RelationType)[keyof typeof RelationType];

export type DirectiveArgs = {
  relation?: Relation;
  key?: string;
};

export type FieldConnection = {
  relation: Relation;
  target: ObjectNode | InterfaceNode | UnionNode;
  key?: string;
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
        `Type ${target.name} is not a valid connection target for ${object.name}.${field.name} `
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
        key: args.key ?? camelCase(field.name, "id"),
      };
    }

    directive = field.getDirective(ConnectionDirective.HAS_MANY);

    if (directive) {
      const args = directive.getArgumentsJSON<DirectiveArgs>();

      return {
        relation: args.relation ?? RelationType.ONE_TO_MANY,
        target: target,
        key: args.key,
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

  private _createFilterInput(target: ObjectNode | InterfaceNode): InputObjectNode {
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
          case BuiltInScalar.ID:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create(`IDFilterInput`))
            );
            continue;
          case BuiltInScalar.Int:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("IntFilterInput"))
            );
            continue;
          case BuiltInScalar.Float:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("FloatFilterInput"))
            );
            continue;
          case BuiltInScalar.Boolean:
            filterInput.addField(
              InputValueNode.create(field.name, NamedTypeNode.create("BooleanFilterInput"))
            );
            continue;
          case BuiltInScalar.String:
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

  private _createConnectionTypes(field: FieldNode, connection: FieldConnection) {
    const { target } = connection;

    if (!this._isConnectionType(target)) {
      const connectionTypeName = pascalCase(target.name, "connection");
      const edgeTypeName = pascalCase(target.name, "edge");

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

      this._setConnectionArguments(field, target);
      field.setType(NonNullTypeNode.create(connectionTypeName));
    }
  }

  private _createEdgesConnection(
    parent: ObjectNode | InterfaceNode,
    field: FieldNode,
    connection: FieldConnection
  ) {
    this._createConnectionTypes(field, connection);
  }

  public before() {
    this.context.document
      .addNode(
        EnumNode.create(
          "ConnectionRelationType",
          ["oneToMany", "manyToMany"],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create("hasOne", "FIELD_DEFINITION", [
          InputValueNode.create("key", "String"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("hasMany", "FIELD_DEFINITION", [
          InputValueNode.create("relation", "ConnectionRelationType"),
          InputValueNode.create("key", "String"),
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

      if (connection.relation === RelationType.ONE_TO_ONE && connection.key) {
        this._setConnectionKey(definition, connection.key, true);
      }

      if (
        connection.relation === RelationType.ONE_TO_MANY &&
        !this._isConnectionType(connection.target)
      ) {
        const sourceKey = connection.key ?? camelCase(definition.name, "id");

        if (connection.target instanceof UnionNode) {
          for (const type of connection.target.types ?? []) {
            const unionType = this.context.document.getNode(type.getTypeName());

            if (unionType instanceof ObjectNode || unionType instanceof InterfaceNode) {
              this._setConnectionKey(unionType, sourceKey, false);
            }
          }
        } else {
          this._setConnectionKey(connection.target, sourceKey, false);
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

      if (connection.relation === RelationType.ONE_TO_MANY) {
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
