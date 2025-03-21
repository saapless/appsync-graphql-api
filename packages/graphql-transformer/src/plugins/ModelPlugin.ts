import { ScalarType, UtilityDirective } from "../constants";
import { ModelOperation, type ModelOperationType } from "../constants/model";
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
import { TransformPluginExecutionError } from "../utils/errors";
import { camelCase, pascalCase, pluralize } from "../utils/strings";
import { WriteOperation } from "../utils/types";
import { TransformerPluginBase } from "./PluginBase";

export type ModelDirectiveArgs = {
  operations?: ModelOperationType[];
};

export class ModelPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("ModelPlugin", context);
  }

  // #region Operations

  private _getOperationNames(object: ObjectNode) {
    const directive = object.getDirective("model");

    if (!directive) {
      throw new TransformPluginExecutionError(
        this.name,
        `@model directive not found for type ${object.name}`
      );
    }

    const args = directive.getArgumentsJSON<ModelDirectiveArgs>();
    return this.context.operations.getModelOperations(args.operations);
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

  private _shouldSkipFieldFromInput(field: FieldNode) {
    return (
      field.hasDirective("readOnly") ||
      field.hasDirective("serverOnly") ||
      field.hasDirective("clientOnly") ||
      field.hasDirective("hasOne") ||
      field.hasDirective("hasMany")
    );
  }

  private _isScalarType(typeName: string) {
    return Object.values(ScalarType).includes(
      typeName as (typeof ScalarType)[keyof typeof ScalarType]
    );
  }

  /**
   * For each field in the model
   * 1. If has `@readOnly` or connection directives - skip
   * 2. If scalar or enum - add to input;
   * 3. If union - skip;
   * 4. If object or interface - check definition;
   *    4.1 If `@model` - skip;
   *    4.2 If implements `Node` interface - skip
   *    4.3 If fields are `@readOnly` - skip;
   */

  private _createMutationInput(
    model: ObjectNode,
    inputName: string,
    requiredFields: string[] = []
  ) {
    const input = InputObjectNode.create(inputName);

    if (inputName.startsWith("Delete")) {
      input.addField(
        InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID")))
      );
    } else {
      for (const field of model.fields ?? []) {
        if (this._shouldSkipFieldFromInput(field)) {
          continue;
        }

        const fieldTypeName = field.type.getTypeName();

        if (requiredFields.includes(field.name)) {
          input.addField(InputValueNode.create(field.name, NonNullTypeNode.create(fieldTypeName)));
          continue;
        }

        // Buildin scalars
        if (this._isScalarType(fieldTypeName)) {
          input.addField(InputValueNode.create(field.name, NamedTypeNode.create(fieldTypeName)));
          continue;
        }

        const typeDef = this.context.document.getNode(fieldTypeName);

        if (!typeDef) {
          throw new TransformPluginExecutionError(this.name, `Unknown type ${fieldTypeName}`);
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

  private _createDeleteMutationField(model: ObjectNode, fieldName: string) {
    const mutationNode = this.context.document.getMutationNode();

    if (!mutationNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), [
        InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))),
      ]);

      mutationNode.addField(field);
    }
  }

  private _createMutationField(
    model: ObjectNode,
    fieldName: string,
    inputName: string,
    requiredFields?: string[]
  ) {
    const mutationNode = this.context.document.getMutationNode();

    if (!this.context.document.getNode(inputName)) {
      this._createMutationInput(model, inputName, requiredFields);
    }

    if (!mutationNode.hasField(fieldName)) {
      const field = FieldNode.create(fieldName, NamedTypeNode.create(model.name), [
        InputValueNode.create("input", NonNullTypeNode.create(NamedTypeNode.create(inputName))),
      ]);

      mutationNode.addField(field);
    }
  }

  private _createMutation(model: ObjectNode, verb: WriteOperation) {
    const fieldName = camelCase(verb, model.name);
    const inputName = pascalCase(verb, model.name, "input");

    if (verb === "delete") {
      this._createDeleteMutationField(model, fieldName);
    } else if (verb === "update") {
      this._createMutationField(model, fieldName, inputName, ["id"]);
    } else {
      this._createMutationField(model, fieldName, inputName);
    }

    this.context.resolvers.setLoader("Mutation", fieldName, {
      operation: {
        type: verb,
        key: { ref: "args.input.id" },
      },
      targetName: model.name,
      returnType: "result",
    });
  }

  // #endregion Operations

  public before() {
    this.context.document
      .addNode(
        EnumNode.create("ModelOperation", Object.values(ModelOperation), [
          DirectiveNode.create(UtilityDirective.INTERNAL),
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
        case "upsert":
        case "update":
        case "delete":
          this._createMutation(definition, verb);
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
