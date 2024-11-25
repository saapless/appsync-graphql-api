import { TransformerContext } from "../../src";
import { DirectiveDefinitionNode, DocumentNode, ObjectNode } from "../../src/parser";
import { ConnectionPlugin } from "../../src/plugins";
import { FieldResolver } from "../../src/resolver";

const schema = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
  }

  type Todo {
    id: ID
    content: String
    resources: Resource @edges
  }

  type Document {
    url: String!
  }

  type Message {
    content: String!
  }

  union Resource = Document | Message

  type Query {
    me: User @node
    todos: Todo @edges
  }
`;

describe("ConnectionPlugin", () => {
  const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
  const plugin = ConnectionPlugin.create(context);

  describe("on run `before` hook", () => {
    beforeAll(() => plugin.before());

    it("adds connection directives", () => {
      expect(context.document.getNode("connection")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("edges")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("node")).toBeInstanceOf(DirectiveDefinitionNode);
    });
  });

  describe("on executing Query node", () => {
    beforeAll(() => {
      plugin.execute(context.document.getQueryNode());
    });

    it.todo("throws error on `edge` directive");
    it.todo("throws error on `node` directive");
  });

  describe("on execute object node", () => {
    beforeAll(() => {
      plugin.execute(context.document.getNode("Todo") as ObjectNode);
    });

    it("creates connection types", () => {
      expect(context.document.getNode("ResourceConnection")).toBeInstanceOf(ObjectNode);
      expect(context.document.getNode("ResourceEdge")).toBeInstanceOf(ObjectNode);
    });

    it("updates field types", () => {
      const todoNode = context.document.getNode("Todo") as ObjectNode;

      expect(todoNode.getField("resources")?.type.getTypeName()).toBe("ResourceConnection");
      expect(todoNode.getField("resources")?.hasArgument("filter")).toBe(false);
      expect(todoNode.getField("resources")?.hasArgument("first")).toBe(true);
      expect(todoNode.getField("resources")?.hasArgument("after")).toBe(true);
      expect(todoNode.getField("resources")?.hasArgument("sort")).toBe(true);
    });

    it("creates field resolvers", () => {
      expect(context.resolvers.get("Todo.resources")).toBeInstanceOf(FieldResolver);
    });
  });
});
