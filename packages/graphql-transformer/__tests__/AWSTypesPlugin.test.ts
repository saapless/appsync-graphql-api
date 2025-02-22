import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { DirectiveDefinitionNode, DocumentNode, ScalarNode } from "../src/definition";
import { TransformerContext } from "../src/context";
import { AWSTypesPlugin } from "../src/plugins/AWSTypesPlugin";

const schema = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
  }
`;

const context = new TransformerContext({
  document: DocumentNode.fromSource(schema),
  dataSourceConfig: TEST_DS_CONFIG,
});
const plugin = AWSTypesPlugin.create(context);

describe("AWSTypesPlugin", () => {
  describe("on run `before` hook", () => {
    beforeAll(() => plugin.before());

    it("adds aws scalar declarations", () => {
      expect(context.document.getNode("AWSDate")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSTime")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSDateTime")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSTimestamp")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSEmail")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSJSON")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSURL")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSPhone")).toBeInstanceOf(ScalarNode);
      expect(context.document.getNode("AWSIPAddress")).toBeInstanceOf(ScalarNode);
    });

    it("adds aws directive definitions", () => {
      expect(context.document.getNode("aws_subscribe")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("aws_cognito_user_pools")).toBeInstanceOf(
        DirectiveDefinitionNode
      );
      expect(context.document.getNode("aws_auth")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("aws_api_key")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("aws_iam")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("aws_oidc")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("aws_lambda")).toBeInstanceOf(DirectiveDefinitionNode);
    });
  });

  describe("on run `after` hook", () => {
    beforeAll(() => plugin.after());

    it("removes aws scalar declarations", () => {
      expect(context.document.getNode("AWSDate")).toBeUndefined();
      expect(context.document.getNode("AWSTime")).toBeUndefined();
      expect(context.document.getNode("AWSDateTime")).toBeUndefined();
      expect(context.document.getNode("AWSTimestamp")).toBeUndefined();
      expect(context.document.getNode("AWSEmail")).toBeUndefined();
      expect(context.document.getNode("AWSJSON")).toBeUndefined();
      expect(context.document.getNode("AWSURL")).toBeUndefined();
      expect(context.document.getNode("AWSPhone")).toBeUndefined();
      expect(context.document.getNode("AWSIPAddress")).toBeUndefined();
    });

    it("removes aws directive definitions", () => {
      expect(context.document.getNode("aws_subscribe")).toBeUndefined();
      expect(context.document.getNode("aws_cognito_user_pools")).toBeUndefined();
      expect(context.document.getNode("aws_auth")).toBeUndefined();
      expect(context.document.getNode("aws_api_key")).toBeUndefined();
      expect(context.document.getNode("aws_iam")).toBeUndefined();
      expect(context.document.getNode("aws_oidc")).toBeUndefined();
      expect(context.document.getNode("aws_lambda")).toBeUndefined();
    });
  });
});
