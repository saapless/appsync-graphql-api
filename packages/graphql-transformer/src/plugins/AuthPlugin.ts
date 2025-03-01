import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../definition";
import { AuthorizationRule } from "../utils/types";
import { TransformerPluginBase } from "./TransformerPluginBase";

/**
 * Directives:
 * * `@auth(rules: [AuthRule!])`
 *
 * Actions:
 * * Handle `@auth` rules or default auth config;
 * * Handle build in aws auth rules;
 * * Add auth stages to resolvers;
 */

export class AuthPlugin extends TransformerPluginBase {
  public readonly name = "AuthPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  private _stashModelRules(model: ObjectNode) {
    const directiveArgs = model
      .getDirective("auth")
      ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    if (directiveArgs?.rules?.length) {
      this.context.auth.setModelReuls(model.name, directiveArgs.rules);
    }
  }

  private _setFieldLoaderRules(object: ObjectNode, field: FieldNode) {
    const definedRules = field
      .getDirective("auth")
      ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    const rules = this.context.auth.getAuthRules(
      "get",
      field.type.getTypeName(),
      definedRules?.rules
    );

    this.context.loader.setFieldLoader(object.name, field.name, {
      targetName: field.type.getTypeName(),
      authRules: rules,
    });
  }

  public before() {
    this.context.document
      .addNode(EnumNode.create("AuthAllowStrategy", ["public", "owner"]))
      .addNode(EnumNode.create("AuthProvider", ["iam", "oidc", "userPools", "lambda"]))
      .addNode(
        InputObjectNode.create("AuthClaim", [
          InputValueNode.create("key", "String"),
          InputValueNode.create("ref", "String"),
          InputValueNode.create("eq", "String"),
          InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("String"))),
          InputValueNode.create("and", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
          InputValueNode.create("or", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
          InputValueNode.create("not", "AuthClaim"),
        ])
      )
      .addNode(
        InputObjectNode.create("AuthRule", [
          InputValueNode.create("allow", "AuthAllowStrategy"),
          InputValueNode.create(
            "operations",
            ListTypeNode.create(NonNullTypeNode.create("ModelOperation"))
          ),
          InputValueNode.create("provider", "AuthProvider"),
          InputValueNode.create("claim", "AuthClaim"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "auth",
          [
            "OBJECT",
            "FIELD_DEFINITION",
            // TODO: Enable this when rules merge is solved
            // "INTERFACE"
          ],
          [InputValueNode.create("rules", ListTypeNode.create(NonNullTypeNode.create("AuthRule")))]
        )
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode) {
      return true;
    }

    return false;
  }

  public after() {
    this.context.document
      .removeNode("auth")
      .removeNode("AuthAllowStrategy")
      .removeNode("AuthClaim")
      .removeNode("AuthProvider")
      .removeNode("AuthRule");
  }

  public normalize(definition: ObjectNode): void {
    if (definition.hasDirective("model") && definition.hasDirective("auth")) {
      this._stashModelRules(definition);
    }
  }

  public execute(definition: ObjectNode) {
    if (!definition.fields?.length) {
      return;
    }

    for (const field of definition.fields) {
      this._setFieldLoaderRules(definition, field);
    }
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    if (definition.hasDirective("auth")) {
      definition.removeDirective("auth");
    }

    for (const field of definition.fields ?? []) {
      if (field.hasDirective("auth")) {
        field.removeDirective("auth");
      }
    }
  }

  static create(context: TransformerContext) {
    return new AuthPlugin(context);
  }
}
