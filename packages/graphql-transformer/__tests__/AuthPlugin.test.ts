import { TestContext } from "../__fixtures__/TestContext";
import { AuthPlugin } from "../src/plugins/AuthPlugin";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  InputObjectNode,
  ObjectNode,
} from "../src/definition";

const schema = /* GraphQL */ `
  type User @model {
    id: ID!
    name: String!
    email: String! @auth(allow: owner)
  }

  type Post @model {
    id: ID!
    title: String!
    owner: User!
  }
`;

describe("AuthPlugin", () => {
  const context = new TestContext({
    outputDirectory: "__test__",
    document: DocumentNode.fromSource(schema),
  });

  const plugin = AuthPlugin.create(context);

  describe("on run `before` hook", () => {
    plugin.before();

    it(`throws if directive already defined`, () => {
      expect(() => plugin.before()).toThrow();
    });

    it("added `@auth` directive", () => {
      expect(context.document.getNode("auth")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("AuthAllowStrategy")).toBeInstanceOf(EnumNode);
      expect(context.document.getNode("AuthProvider")).toBeInstanceOf(EnumNode);
      expect(context.document.getNode("AuthClaim")).toBeInstanceOf(InputObjectNode);
    });
  });

  describe("on cleaup node", () => {
    beforeAll(() => {
      plugin.cleanup(context.document.getNode("Post") as ObjectNode);
      plugin.cleanup(context.document.getNode("User") as ObjectNode);
    });

    it(`removed auth directives from node`, () => {
      const postNode = context.document.getNode("Post") as ObjectNode;
      const userNode = context.document.getNode("User") as ObjectNode;

      expect(postNode.hasDirective("auth")).toBeFalsy();
      expect(userNode.hasDirective("auth")).toBeFalsy();
    });

    it(`removed node auth directives from fields`, () => {
      const userNode = context.document.getNode("User") as ObjectNode;

      userNode.fields?.forEach((field) => {
        expect(field.hasDirective("auth")).toBeFalsy();
      });
    });
  });

  describe("on run `after` hook", () => {
    beforeAll(() => {
      plugin.after();
    });

    it(`removed directive definition`, () => {
      expect(context.document.getNode("auth")).toBeUndefined();
      expect(context.document.getNode("AuthAllowStrategy")).toBeUndefined();
      expect(context.document.getNode("AuthProvider")).toBeUndefined();
      expect(context.document.getNode("AuthClaim")).toBeUndefined();
    });
  });
});
