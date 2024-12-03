import { ModelPlugin, TransformerContext } from "../../src";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  InputObjectNode,
  ObjectNode,
} from "../../src/parser";

describe("ModelPlugin", () => {
  const context = new TransformerContext({
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

    it("adds helper directive definitions", () => {
      expect(context.document.getNode("readonly")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("writeonly")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("ignore")).toBeInstanceOf(DirectiveDefinitionNode);
    });

    it(`adds scalar model inputs`, () => {
      expect(context.document.getNode("ModelStringInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelIntInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelFloatInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelBooleanInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelIDInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelSizeInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("ModelListInput")).toBeInstanceOf(InputObjectNode);
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
      expect(query.getField("listModels")?.hasDirective("connection")).toBeTruthy();
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
      expect(mutationNode.getField("deleteModel")?.hasArgument("input")).toBeTruthy();
      expect(mutationNode.getField("deleteModel")?.type.getTypeName()).toBe("Model");
    });

    it("creates operation inputs", () => {
      expect(context.document.getNode("CreateModelInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("UpdateModelInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("DeleteModelInput")).toBeInstanceOf(InputObjectNode);
    });

    it("creates operation resolvers", () => {
      expect(context.resolvers.get("Query.getModel")).toBeDefined();
      expect(context.resolvers.get("Query.listModels")).toBeDefined();

      expect(context.resolvers.get("Mutation.createModel")).toBeDefined();
      expect(context.resolvers.get("Mutation.updateModel")).toBeDefined();
      expect(context.resolvers.get("Mutation.deleteModel")).toBeDefined();
    });
  });

  describe("on cleanup nodes", () => {
    beforeAll(() => {
      plugin.cleanup(context.document.getNode("Model") as ObjectNode);
    });

    it("removes model node", () => {
      expect((context.document.getNode("Model") as ObjectNode)?.hasDirective("model")).toBeFalsy();
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
    it("removes helper directives definitions", () => {
      expect(context.document.getNode("readonly")).toBeUndefined();
      expect(context.document.getNode("writeonly")).toBeUndefined();
      expect(context.document.getNode("ignore")).toBeUndefined();
    });
    it.skip("removes all directive from declarations", () => {
      const model = context.document.getNode("Model") as ObjectNode;
      expect(model.hasDirective("model")).toBe(false);
    });
  });
});
