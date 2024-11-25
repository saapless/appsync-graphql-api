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
} from "../parser";
import { FieldResolver } from "../resolver";
import { InvalidDefinitionError, TransformExecutionError } from "../utils/errors";
import { camelCase, pascalCase } from "../utils/strings";
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

  //#region Create Resources

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

    let operations = ["create", "update", "delete", "get", "list"];

    if (directive.hasArgument("operations")) {
      const args = directive.getArgumentsJSON<{ operations?: ModelOperationType[] }>();

      if (Array.isArray(args.operations)) {
        operations = args.operations;
      }
    }

    return operations;
  }

  private _createGetQuery(model: ObjectNode) {
    const fieldName = camelCase("get", model.name);
    const queryNode = this.context.document.getQueryNode();

    // We allow users to implement custom definition for fields.
    // So, if the field already exists, we skip creating it.
    if (!queryNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), [
        InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))),
      ]);

      queryNode.addField(field);
    }

    // 2 Create field resolver
    if (!this.context.resolvers.has(`Query.${fieldName}`)) {
      this.context.resolvers.set(`Query.${fieldName}`, FieldResolver.create("Query", fieldName));
    }
  }

  private _createListQuery(model: ObjectNode) {
    // TODO: add helper to handle plural name
    const fieldName = `list${model.name}s`;
    const queryNode = this.context.document.getQueryNode();

    if (!queryNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), null, [
        DirectiveNode.create("connection", [
          ArgumentNode.create("relation", ValueNode.enum("oneMany")),
          ArgumentNode.create("key", ValueNode.string("__typename")),
          ArgumentNode.create("index", ValueNode.string("byTypename")),
        ]),
      ]);
      queryNode.addField(field);
    }

    if (!this.context.resolvers.has(`Query.${fieldName}`)) {
      this.context.resolvers.set(`Query.${fieldName}`, FieldResolver.create("Query", fieldName));
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
    if (!this.context.document.getNode(inputName)) {
      const input = InputObjectNode.create(inputName);

      // Special case for delete. we only need id & _version here.
      if (inputName.startsWith("Delete")) {
        input
          .addField(InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))))
          .addField(InputValueNode.create("_version", NonNullTypeNode.create("Int")));
      } else {
        for (const field of model.fields ?? []) {
          if (
            field.hasDirective("readonly") ||
            field.hasDirective("ignore") ||
            field.hasDirective("connection")
          ) {
            continue;
          }

          if (field.name === "id" || field.name === "_version") {
            input.addField(
              InputValueNode.create(
                field.name,
                nonNullIdOrVersion
                  ? NonNullTypeNode.create(field.name)
                  : NamedTypeNode.create(field.name)
              )
            );
            continue;
          }

          const fieldTypeName = field.type.getTypeName();

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
              typeDef.hasDirective("readonly") ||
              typeDef.hasInterface("Node")
            ) {
              continue;
            }

            this._createMutationInput(typeDef, pascalCase(fieldTypeName, "input"));

            input.addField(
              InputValueNode.create(field.name, NamedTypeNode.create(`${fieldTypeName}Input`))
            );
          }
        }
      }

      this.context.document.addNode(input);
    }
  }

  private _createMutation(model: ObjectNode, verb: string, nonNullIdOrVersion = false) {
    const fieldName = camelCase(verb, model.name);
    const inputName = pascalCase(verb, model.name, "input");

    this._createMutationInput(model, inputName, nonNullIdOrVersion);

    const mutationNode = this.context.document.getMutationNode();

    if (!mutationNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), [
        InputValueNode.create("input", NonNullTypeNode.create(NamedTypeNode.create(inputName))),
      ]);

      mutationNode.addField(field);
    }

    if (!this.context.resolvers.has(`Mutation.${fieldName}`)) {
      this.context.resolvers.set(
        `Mutation.${fieldName}`,
        FieldResolver.create("Mutation", fieldName)
      );
    }
  }

  //#endregion

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
      )
      .addNode(DirectiveDefinitionNode.create("readonly", ["OBJECT", "FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create("writeonly", ["FIELD_DEFINITION"]))
      .addNode(DirectiveDefinitionNode.create("ignore", ["FIELD_DEFINITION"]));

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
        case "update":
        case "upsert":
        case "delete":
          this._createMutation(definition, verb);
          break;
        default:
          continue;
      }
    }
  }

  public after(): void {
    this.context.document
      .removeNode("model")
      .removeNode("ModelOperation")
      .removeNode("readonly")
      .removeNode("writeonly")
      .removeNode("ignore");
  }

  static create(context: TransformerContext) {
    return new ModelPlugin(context);
  }
}
