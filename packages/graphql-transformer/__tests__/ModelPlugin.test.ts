import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { TransformerContext } from "../src/context";
import { ModelPlugin } from "../src/plugins/ModelPlugin";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  InputObjectNode,
  ObjectNode,
} from "../src/definition";

describe("ModelPlugin", () => {
  const context = new TransformerContext({
    document: DocumentNode.fromSource(/* GraphQL */ `
      type Model @model {
        id: ID!
        name: String!
      }
    `),
    dataSourceConfig: TEST_DS_CONFIG,
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

    it.skip(`adds scalar model inputs`, () => {
      expect(context.document.getNode("StringFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("IntFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("FloatFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("BooleanFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("IDFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("SizeFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ListFilterInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("SortDirection")).toBeInstanceOf(EnumNode);
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

    it.skip("creates operation resolvers", () => {
      expect(context.resolvers.getFieldResolver("Query", "getModel")).toBeDefined();
      expect(context.resolvers.getFieldResolver("Query", "listModels")).toBeDefined();

      expect(context.resolvers.getFieldResolver("Mutation", "createModel")).toBeDefined();
      expect(context.resolvers.getFieldResolver("Mutation", "updateModel")).toBeDefined();
      expect(context.resolvers.getFieldResolver("Mutation", "deleteModel")).toBeDefined();
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
