import { ModelPlugin } from "../src/plugins/ModelPlugin";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  InputObjectNode,
  ObjectNode,
} from "../src/definition";
import { TestContext } from "../__fixtures__/TestContext";

describe("ModelPlugin", () => {
  const context = new TestContext({
    outputDirectory: "__test__",
    document: DocumentNode.fromSource(/* GraphQL */ `
      type Model @model {
        id: ID!
        name: String!
      }
    `),
  });

  const plugin = ModelPlugin.create(context);

  describe("on run `before` hook", () => {
    beforeAll(() => {
      plugin.before();
    });

    it(`throws if directive already defined`, () => {
      expect(() => plugin.before()).toThrow();
    });

    it(`adds model directive directive definition`, () => {
      expect(context.document.getNode("model")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("ModelOperation")).toBeInstanceOf(EnumNode);
    });
  });

  describe("on executing model node", () => {
    beforeAll(() => {
      plugin.execute(context.document.getNode("Model") as ObjectNode);
    });

    it("creates query fields", () => {
      const query = context.document.getQueryNode();

      expect(query.hasField("getModel")).toBeTruthy();
      expect(query.getField("getModel")?.hasArgument("id")).toBeTruthy();
      expect(query.hasField("listModels")).toBeTruthy();
      expect(query.getField("listModels")?.hasDirective("hasMany")).toBeTruthy();
    });

    it("creates mutation fields", () => {
      const mutationNode = context.document.getMutationNode();
      expect(mutationNode.hasField("createModel")).toBeTruthy();
      expect(mutationNode.getField("createModel")?.hasArgument("input")).toBeTruthy();
      expect(mutationNode.getField("createModel")?.type.getTypeName()).toBe("Model");

      expect(mutationNode.hasField("updateModel")).toBeTruthy();
      expect(mutationNode.getField("updateModel")?.hasArgument("input")).toBeTruthy();
      expect(mutationNode.getField("updateModel")?.type.getTypeName()).toBe("Model");

      expect(mutationNode.hasField("deleteModel")).toBeTruthy();
      expect(mutationNode.getField("deleteModel")?.hasArgument("id")).toBeTruthy();
      expect(mutationNode.getField("deleteModel")?.type.getTypeName()).toBe("Model");
    });

    it("creates operation inputs", () => {
      expect(context.document.getNode("CreateModelInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("UpdateModelInput")).toBeInstanceOf(InputObjectNode);
    });

    it("adds mutation loaders", () => {
      expect(context.resolvers.hasLoader("Mutation", "createModel")).toBeTruthy();
      expect(context.resolvers.hasLoader("Mutation", "updateModel")).toBeTruthy();
      expect(context.resolvers.hasLoader("Mutation", "deleteModel")).toBeTruthy();
    });
  });

  describe("on cleanup nodes", () => {
    beforeAll(() => {
      plugin.cleanup(context.document.getNode("Model") as ObjectNode);
    });

    it("removes model node", () => {
      const model = context.document.getNode("Model") as ObjectNode;
      expect(model.hasDirective("model")).toBe(false);
    });
  });

  describe("on run `after` hook", () => {
    beforeAll(() => {
      plugin.after();
    });

    it("removes `model` directive definition", () => {
      expect(context.document.getNode("model")).toBeUndefined();
      expect(context.document.getNode("ModelOperation")).toBeUndefined();
    });
  });
});
