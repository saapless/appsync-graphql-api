import { TransformerContext } from "../context";
import {
  ArgumentNode,
  DefinitionNode,
  DirectiveDefinitionNode,
  DirectiveNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
  ScalarNode,
  ValueNode,
} from "../definition";
import { InvalidDefinitionError, TransformExecutionError } from "../utils/errors";
import { camelCase, pascalCase, pluralize } from "../utils/strings";
import { AuthorizationRule, LoaderActionType, WriteOperation } from "../utils/types";
import { TransformerPluginBase } from "./TransformerPluginBase";

type ModelOperationType =
  | "create"
  | "update"
  | "delete"
  | "upsert"
  | "write" // Shorthand for "create & update & delete"
  | "get"
  | "list"
  | "sync"
  | "subscribe"
  | "read"; // Shorthand for "get & list";

export class ModelPlugin extends TransformerPluginBase {
  public readonly name = "ModelPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  // #region Model Resources

  private _createModelSizeInput() {
    const input = InputObjectNode.create("ModelSizeInput", [
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

  private _createModelStringInput() {
    const input = InputObjectNode.create("ModelStringInput", [
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
      InputValueNode.create("size", NamedTypeNode.create("ModelSizeInput")),
    ]);

    this.context.document.addNode(input);
  }

  private _createModelIntInput() {
    const input = InputObjectNode.create("ModelIntInput", [
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

  private _createModelFloatInput() {
    const input = InputObjectNode.create("ModelFloatInput", [
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

  private _createModelBooleanInput() {
    const input = InputObjectNode.create("ModelBooleanInput", [
      InputValueNode.create("ne", NamedTypeNode.create("Boolean")),
      InputValueNode.create("eq", NamedTypeNode.create("Boolean")),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createModelIDInput() {
    const input = InputObjectNode.create("ModelIDInput", [
      InputValueNode.create("ne", NamedTypeNode.create("ID")),
      InputValueNode.create("eq", NamedTypeNode.create("ID")),
      InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("ID"))),
      InputValueNode.create("attributeExists", NamedTypeNode.create("Boolean")),
    ]);

    this.context.document.addNode(input);
  }

  private _createModelListInput() {
    const input = InputObjectNode.create("ModelListInput", [
      InputValueNode.create("contains", NamedTypeNode.create("String")),
      InputValueNode.create("notContains", NamedTypeNode.create("String")),
      InputValueNode.create("size", NamedTypeNode.create("ModelSizeInput")),
    ]);

    this.context.document.addNode(input);
  }

  private _createSortDirection() {
    const enumNode = EnumNode.create("SortDirection", ["ASC", "DESC"]);
    this.context.document.addNode(enumNode);
  }

  // #endregion Model Resources

  // #region Operations

  /**
   * TODO:
   *  * Handle shorthands - `read` & `write`
   *  * User should be able to pass a list of default operations.
   *  * Default operations should be passed to context in order for plugins to reference it.
   */

  private _getOperationNames(object: ObjectNode) {
    const directive = object.getDirective("model");

    if (!directive) {
      throw new TransformExecutionError(`@model directive not found for type ${object.name}`);
    }

    const args = directive.getArgumentsJSON<{ operations?: ModelOperationType[] }>();
    const operations: ModelOperationType[] = args.operations ?? this.context.defaultModelOperations;

    return this.context.expandOperations(operations);
  }

  private _createGetQuery(model: ObjectNode) {
    const fieldName = camelCase("get", model.name);
    const queryNode = this.context.document.getQueryNode();

    // We allow users to implement custom definition for fields.
    // So, if the field already exists, we skip creating it.
    if (!queryNode.hasField(fieldName)) {
      const field = FieldNode.create(
        fieldName,
        NamedTypeNode.create(model.name),
        [InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID")))],
        [
          DirectiveNode.create("hasOne", [
            ArgumentNode.create("key", ValueNode.fromValue({ ref: "args.id" })),
          ]),
        ]
      );

      queryNode.addField(field);
    }
  }

  private _createListQuery(model: ObjectNode) {
    const fieldName = camelCase("list", pluralize(model.name));
    const queryNode = this.context.document.getQueryNode();

    if (!queryNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), null, [
        DirectiveNode.create("hasMany", [
          ArgumentNode.create("relation", ValueNode.enum("oneToMany")),
          ArgumentNode.create("key", ValueNode.fromValue({ eq: model.name })),
          ArgumentNode.create("index", ValueNode.string("byTypename")),
        ]),
      ]);

      queryNode.addField(field);
    }
  }

  /**
   * For each field in the model
   * 1. If has `@readonly` or `@connection` directive - skip
   * 2. If scalar or enum - add to input;
   * 3. If union - skip;
   * 4. If object or interface - check definition;
   *    4.1 If `@model` - skip;
   *    4.2 If implements `Node` interface - skip
   *    4.3 If `@readonly` - skip;
   */

  private _createMutationInput(model: ObjectNode, inputName: string, nonNullIdOrVersion = false) {
    const input = InputObjectNode.create(inputName);

    // Special case for delete. we only need id & _version here.
    if (inputName.startsWith("Delete")) {
      input
        .addField(InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))))
        .addField(InputValueNode.create("_version", NonNullTypeNode.create("Int")));
    } else {
      for (const field of model.fields ?? []) {
        if (
          field.hasDirective("readOnly") ||
          field.hasDirective("serverOnly") ||
          field.hasDirective("clientOnly") ||
          field.hasDirective("hasOne") ||
          field.hasDirective("hasMany")
        ) {
          continue;
        }

        const fieldTypeName = field.type.getTypeName();

        if (field.name === "id" || field.name === "_version") {
          input.addField(
            InputValueNode.create(
              field.name,
              nonNullIdOrVersion
                ? NonNullTypeNode.create(fieldTypeName)
                : NamedTypeNode.create(fieldTypeName)
            )
          );
          continue;
        }

        // Buildin scalars
        if (["ID", "String", "Int", "Float", "Boolean"].includes(fieldTypeName)) {
          input.addField(InputValueNode.create(field.name, NamedTypeNode.create(fieldTypeName)));
          continue;
        }

        const typeDef = this.context.document.getNode(fieldTypeName);

        if (!typeDef) {
          throw new InvalidDefinitionError(`Unknown type ${fieldTypeName}`);
        }

        if (typeDef instanceof ScalarNode || typeDef instanceof EnumNode) {
          input.addField(InputValueNode.create(field.name, NamedTypeNode.create(fieldTypeName)));
          continue;
        }

        if (typeDef instanceof ObjectNode) {
          if (
            typeDef.hasDirective("model") ||
            typeDef.hasDirective("readOnly") ||
            typeDef.hasDirective("serverOnly") ||
            typeDef.hasDirective("clientOnly") ||
            typeDef.hasInterface("Node")
          ) {
            continue;
          }

          const inputName = pascalCase(fieldTypeName, "input");

          if (!this.context.document.hasNode(inputName)) {
            this._createMutationInput(typeDef, inputName);
          }

          input.addField(InputValueNode.create(field.name, NamedTypeNode.create(inputName)));
        }
      }
    }

    this.context.document.addNode(input);
  }

  private _getVerbAction(verb: WriteOperation): LoaderActionType {
    switch (verb) {
      case "create":
        return "putItem";
      case "update":
        return "updateItem";
      case "delete":
        return "removeItem";
      case "upsert":
        return "upsertItem";
    }
  }

  private _createMutation(model: ObjectNode, verb: WriteOperation, nonNullIdOrVersion = false) {
    const fieldName = camelCase(verb, model.name);
    const inputName = pascalCase(verb, model.name, "input");

    if (!this.context.document.getNode(inputName)) {
      this._createMutationInput(model, inputName, nonNullIdOrVersion);
    }

    const mutationNode = this.context.document.getMutationNode();

    if (!mutationNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), [
        InputValueNode.create("input", NonNullTypeNode.create(NamedTypeNode.create(inputName))),
      ]);

      mutationNode.addField(field);
    }

    const authRules = model
      .getDirective("auth")
      ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    this.context.loader.setFieldLoader("Mutation", fieldName, {
      action: {
        type: this._getVerbAction(verb),
        key: { id: { ref: "args.input.id" } },
      },
      targetName: model.name,
      authRules: authRules?.rules,
    });
  }

  // #endregion Operations

  public before() {
    this.context.document
      .addNode(
        EnumNode.create("ModelOperation", [
          "read",
          "get",
          "list",
          "sync",
          "subscribe",
          "write",
          "create",
          "update",
          "upsert",
          "delete",
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "model",
          ["OBJECT"],
          [
            InputValueNode.create(
              "operations",
              ListTypeNode.create(NonNullTypeNode.create("ModelOperation"))
            ),
          ]
        )
      );

    this._createModelSizeInput();
    this._createModelStringInput();
    this._createModelIntInput();
    this._createModelFloatInput();
    this._createModelBooleanInput();
    this._createModelIDInput();
    this._createModelListInput();
    this._createSortDirection();
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode && definition.hasDirective("model")) {
      return true;
    }

    return false;
  }

  public execute(definition: ObjectNode) {
    // 1. Add operation fields
    const operations = this._getOperationNames(definition);

    for (const verb of operations) {
      switch (verb) {
        case "get":
          this._createGetQuery(definition);
          break;
        case "list":
          this._createListQuery(definition);
          break;
        case "create":
          this._createMutation(definition, verb);
          break;
        case "upsert":
          this._createMutation(definition, verb);
          break;
        case "update":
          this._createMutation(definition, verb, true);
          break;
        case "delete":
          this._createMutation(definition, verb, true);
          break;
        default:
          continue;
      }
    }
  }

  public cleanup(definition: ObjectNode): void {
    definition.removeDirective("model");
  }

  public after(): void {
    this.context.document.removeNode("model").removeNode("ModelOperation");
  }

  static create(context: TransformerContext) {
    return new ModelPlugin(context);
  }
}
