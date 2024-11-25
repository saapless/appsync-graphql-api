import { AuthPlugin, TransformerContext } from "../../src";
import { DirectiveDefinitionNode, DocumentNode } from "../../src/parser";

const schema = /* GraphQL */ `
  type User @auth(allow: owner) {
    id: ID!
    name: String!
  }
`;

describe("AuthPlugin", () => {
  const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
  const plugin = AuthPlugin.create(context);

  describe("on run `before` hook", () => {
    plugin.before();

    it(`throws if directive already defined`, () => {
      expect(() => plugin.before()).toThrow("Node with name auth already exists");
    });

    it("added `@auth` directive", () => {
      expect(context.document.getNode("auth")).toBeInstanceOf(DirectiveDefinitionNode);
    });
  });

  describe(`on execute node`, () => {
    it.todo(`merged auth directives`);
    it.todo(`added AUTH stage to operation resolvers`);
    it.todo(`added AUTH stage to field resolvers`);
    it.todo(`added AUTH stage to node operation`);
  });

  describe("on run `after` hook", () => {
    it.todo(`removed directive definition`);
    it.todo(`removed directive from node`);
    it.todo(`removed directive from fields`);
  });
});
