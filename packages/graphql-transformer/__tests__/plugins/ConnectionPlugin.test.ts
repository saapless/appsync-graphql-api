import { TransformerContext } from "../../src";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  ObjectNode,
} from "../../src/parser";
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
    me: User @node(key: "id", ref: "identity.sub")
    todos: Todo
      @connection(key: "userId", ref: "identity.sub", sk: { beginsWith: "Todo" }, index: "byUserId")
  }
`;

describe("ConnectionPlugin", () => {
  const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
  const plugin = ConnectionPlugin.create(context);

  describe("on run `before` hook", () => {
    beforeAll(() => plugin.before());

    it("adds connection directive definitions", () => {
      expect(context.document.getNode("ConnectionRelationType")).toBeInstanceOf(EnumNode);
      expect(context.document.getNode("SortKeyInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("connection")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("edges")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("node")).toBeInstanceOf(DirectiveDefinitionNode);
    });
  });

  describe("on normalize node", () => {
    beforeAll(() => {
      plugin.normalize(context.document.getQueryNode());
      plugin.normalize(context.document.getNode("Todo") as ObjectNode);
    });

    it("updates `node` connection arguments", () => {
      const queryNode = context.document.getQueryNode();
      expect(queryNode.getField("me")?.hasDirective("node")).toBeFalsy();
      expect(queryNode.getField("me")?.hasDirective("connection")).toBeTruthy();
    });

    it("updates `edges` connection arguments", () => {
      const todoNode = context.document.getNode("Todo") as ObjectNode;
      expect(todoNode.getField("resources")?.hasDirective("edges")).toBeFalsy();
      expect(todoNode.getField("resources")?.hasDirective("connection")).toBeTruthy();
    });

    it("adds connection keys to nodes", () => {
      expect((context.document.getNode("Todo") as ObjectNode).getField("userId")).toBeInstanceOf(
        FieldNode
      );
      expect(
        (context.document.getNode("Document") as ObjectNode).getField("sourceId")
      ).toBeInstanceOf(FieldNode);
      expect(
        (context.document.getNode("Message") as ObjectNode).getField("sourceId")
      ).toBeInstanceOf(FieldNode);
    });
  });

  describe("on execute object node", () => {
    beforeAll(() => {
      plugin.execute(context.document.getNode("Query") as ObjectNode);
      plugin.execute(context.document.getNode("Todo") as ObjectNode);
    });

    it("creates connection types", () => {
      expect(context.document.getNode("TodoConnection")).toBeInstanceOf(ObjectNode);
      expect(context.document.getNode("TodoEdge")).toBeInstanceOf(ObjectNode);
      expect(context.document.getNode("ResourceConnection")).toBeInstanceOf(ObjectNode);
      expect(context.document.getNode("ResourceEdge")).toBeInstanceOf(ObjectNode);
    });

    it("updates field types", () => {
      const todosField = (context.document.getNode("Query") as ObjectNode).getField("todos");
      const resourcesField = (context.document.getNode("Todo") as ObjectNode).getField("resources");

      expect(todosField?.type.getTypeName()).toBe("TodoConnection");
      expect(todosField?.getArgument("filter")?.type.getTypeName()).toBe("TodoFilterInput");
      expect(todosField?.hasArgument("first")).toBe(true);
      expect(todosField?.hasArgument("after")).toBe(true);
      expect(todosField?.hasArgument("sort")).toBe(true);

      expect(resourcesField?.type.getTypeName()).toBe("ResourceConnection");
      expect(resourcesField?.getArgument("filter")?.type.getTypeName()).toBe("ResourceFilterInput");
      expect(resourcesField?.hasArgument("first")).toBe(true);
      expect(resourcesField?.hasArgument("after")).toBe(true);
      expect(resourcesField?.hasArgument("sort")).toBe(true);
    });

    it("creates field resolvers", () => {
      expect(context.resolvers.get("Todo.resources")).toBeInstanceOf(FieldResolver);
    });
  });

  describe("on cleanup node", () => {
    beforeAll(() => {
      plugin.cleanup(context.document.getNode("Query") as ObjectNode);
      plugin.cleanup(context.document.getNode("Todo") as ObjectNode);
    });

    it("removes connection directives from fields", () => {
      const queryNode = context.document.getNode("Query") as ObjectNode;
      const todoNode = context.document.getNode("Todo") as ObjectNode;

      expect(queryNode.getField("me")?.hasDirective("connection")).toBeFalsy();
      expect(queryNode.getField("todos")?.hasDirective("connection")).toBeFalsy();
      expect(todoNode.getField("resources")?.hasDirective("connection")).toBeFalsy();
    });
  });

  describe("on run `after` hook", () => {
    beforeAll(() => {
      plugin.after();
    });

    it("removes connection directive definitions", () => {
      expect(context.document.getNode("ConnectionRelationType")).toBeUndefined();
      expect(context.document.getNode("SortKeyInput")).toBeUndefined();
      expect(context.document.getNode("connection")).toBeUndefined();
      expect(context.document.getNode("edges")).toBeUndefined();
      expect(context.document.getNode("node")).toBeUndefined();
    });
  });

  it("matches snapshot", () => {
    expect(context.document.print()).toMatchSnapshot();
  });
});
