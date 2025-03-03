import { TransformerContext } from "../context";
import {
  DirectiveDefinitionNode,
  EnumNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../definition";
import { TransformerPluginBase } from "./PluginBase";

/**
 * Adds authorization directive to the schema.
 * @category Transformer
 */

export class AuthPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("AuthPlugin", context);
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

  public match() {
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

  public execute() {}

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
