import { UtilityDirective } from "../constants";
import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  DirectiveNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../definition";
import { AuthorizationRule } from "../utils";
import { TransformerPluginBase } from "./PluginBase";

/**
 * Adds authorization directive to the schema.
 * @category Transformer
 */

export class AuthPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("AuthPlugin", context);
  }

  private _stashModelRules(model: ObjectNode) {
    const directiveArgs = model
      .getDirective("auth")
      ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    if (directiveArgs?.rules?.length) {
      this.context.auth.setModelRules(model.name, directiveArgs.rules);
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

    this.context.resolvers.setLoader(object.name, field.name, {
      targetName: field.type.getTypeName(),
      authRules: rules,
    });
  }

  public before() {
    this.context.document
      .addNode(
        EnumNode.create(
          "AuthAllowStrategy",
          ["public", "owner"],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        EnumNode.create(
          "AuthProvider",
          ["iam", "oidc", "userPools", "lambda"],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        InputObjectNode.create(
          "AuthClaim",
          [
            InputValueNode.create("key", "String"),
            InputValueNode.create("ref", "String"),
            InputValueNode.create("eq", "String"),
            InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("String"))),
            InputValueNode.create("and", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
            InputValueNode.create("or", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
            InputValueNode.create("not", "AuthClaim"),
          ],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
      )
      .addNode(
        InputObjectNode.create(
          "AuthRule",
          [
            InputValueNode.create("allow", "AuthAllowStrategy"),
            InputValueNode.create(
              "operations",
              ListTypeNode.create(NonNullTypeNode.create("ModelOperation"))
            ),
            InputValueNode.create("provider", "AuthProvider"),
            InputValueNode.create("claim", "AuthClaim"),
          ],
          [DirectiveNode.create(UtilityDirective.INTERNAL)]
        )
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

  public match(definition: DefinitionNode): boolean {
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
    for (const field of definition.fields ?? []) {
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
