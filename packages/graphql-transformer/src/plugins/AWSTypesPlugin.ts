import { TransformerContext } from "../context";
import {
  DirectiveDefinitionNode,
  InputValueNode,
  ListTypeNode,
  NonNullTypeNode,
  ScalarNode,
} from "../definition";
import { TransformerPluginBase } from "./PluginBase";

/**
 * This plugin deals with AWS specific scalars and directives.
 * Mainly used to satisfy schema validation.
 */

export class AWSTypesPlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("AWSTypesPlugin", context);
  }

  public before(): void {
    this.context.document
      .addNode(ScalarNode.create("AWSDate"))
      .addNode(ScalarNode.create("AWSTime"))
      .addNode(ScalarNode.create("AWSDateTime"))
      .addNode(ScalarNode.create("AWSTimestamp"))
      .addNode(ScalarNode.create("AWSEmail"))
      .addNode(ScalarNode.create("AWSJSON"))
      .addNode(ScalarNode.create("AWSPhone"))
      .addNode(ScalarNode.create("AWSURL"))
      .addNode(ScalarNode.create("AWSIPAddress"))
      .addNode(DirectiveDefinitionNode.create("aws_api_key", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(
        DirectiveDefinitionNode.create(
          "aws_auth",
          ["FIELD_DEFINITION", "OBJECT"],
          [
            InputValueNode.create(
              "cognito_groups",
              NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
            ),
          ]
        )
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "aws_cognito_user_pools",
          ["FIELD_DEFINITION", "OBJECT"],
          [
            InputValueNode.create(
              "cognito_groups",
              NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
            ),
          ]
        )
      )
      .addNode(DirectiveDefinitionNode.create("aws_iam", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(DirectiveDefinitionNode.create("aws_lambda", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(DirectiveDefinitionNode.create("aws_oidc", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(
        DirectiveDefinitionNode.create(
          "aws_subscribe",
          ["FIELD_DEFINITION"],
          [
            InputValueNode.create(
              "mutations",
              NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
            ),
          ]
        )
      );
  }

  public match() {
    return false;
  }

  public execute() {}

  public after(): void {
    this.context.document
      .removeNode("AWSDate")
      .removeNode("AWSTime")
      .removeNode("AWSDateTime")
      .removeNode("AWSTimestamp")
      .removeNode("AWSEmail")
      .removeNode("AWSJSON")
      .removeNode("AWSPhone")
      .removeNode("AWSURL")
      .removeNode("AWSIPAddress")
      .removeNode("aws_api_key")
      .removeNode("aws_auth")
      .removeNode("aws_cognito_user_pools")
      .removeNode("aws_iam")
      .removeNode("aws_lambda")
      .removeNode("aws_oidc")
      .removeNode("aws_subscribe");
  }

  static create(context: TransformerContext) {
    return new AWSTypesPlugin(context);
  }
}
