import { TransformerContext } from "../context";
import {
  DirectiveDefinitionNode,
  InputValueNode,
  ListTypeNode,
  NonNullTypeNode,
  ScalarNode,
} from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

/**
 * This plugin deals with AWS specific scalars and directives.
 * Mainly used to satisfy schema validation.
 */

export class AWSTypesPlugin extends TransformerPluginBase {
  public readonly name: string = "AWSTypesPlugin";
  constructor(context: TransformerContext) {
    super(context);
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
        DirectiveDefinitionNode.create("aws_auth", ["FIELD_DEFINITION", "OBJECT"], false, [
          InputValueNode.create(
            "cognito_groups",
            NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
          ),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "aws_cognito_user_pools",
          ["FIELD_DEFINITION", "OBJECT"],
          false,
          [
            InputValueNode.create(
              "cognito_groups",
              NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
            ),
          ]
        )
      )
      .addNode(DirectiveDefinitionNode.create("aws_lambda", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(DirectiveDefinitionNode.create("aws_oidc", ["FIELD_DEFINITION", "OBJECT"]))
      .addNode(
        DirectiveDefinitionNode.create("aws_subscribe", ["FIELD_DEFINITION"], false, [
          InputValueNode.create(
            "mutations",
            NonNullTypeNode.create(ListTypeNode.create(NonNullTypeNode.create("String")))
          ),
        ])
      );
  }

  public match() {
    return false;
  }

  public execute() {
    return;
  }

  static create(context: TransformerContext) {
    return new AWSTypesPlugin(context);
  }
}
