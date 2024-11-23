import { DirectiveDefinitionNode, ObjectNode } from "../../src/parser";
import { ConnectionPlugin } from "../../src/plugins";
import { FieldResolver } from "../../src/resolver";
import { createTransformer } from "../../src/transformer";

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
  const transformer = createTransformer({ definition: schema, plugins: [ConnectionPlugin] });
  transformer.transform();
  const { document, resolvers } = transformer.context;

  it("adds connection directives", () => {
    expect(document.getNode("connection")).toBeDefined();
    expect(document.getNode("connection")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(document.getNode("edges")).toBeDefined();
    expect(document.getNode("edges")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(document.getNode("node")).toBeDefined();
    expect(document.getNode("node")).toBeInstanceOf(DirectiveDefinitionNode);
  });

  it("adds connection types", () => {
    expect(document.getNode("TodoConnection")).toBeDefined();
    expect(document.getNode("TodoConnection")).toBeInstanceOf(ObjectNode);
    expect(document.getNode("TodoEdge")).toBeDefined();
    expect(document.getNode("TodoEdge")).toBeInstanceOf(ObjectNode);
    expect(document.getNode("ResourceConnection")).toBeDefined();
    expect(document.getNode("ResourceConnection")).toBeInstanceOf(ObjectNode);
    expect(document.getNode("ResourceEdge")).toBeDefined();
    expect(document.getNode("ResourceEdge")).toBeInstanceOf(ObjectNode);
  });

  it("updates field types", () => {
    const todo = document.getNode("Todo") as ObjectNode;
    const query = document.getQueryNode();

    expect(todo.getField("resources")?.type.getTypeName()).toBe("ResourceConnection");
    expect(query.getField("todos")?.type.getTypeName()).toBe("TodoConnection");
  });

  it("creates field resolvers", () => {
    expect(resolvers.get("Todo.resources")).toBeInstanceOf(FieldResolver);
    expect(resolvers.get("Query.todos")).toBeInstanceOf(FieldResolver);
    expect(resolvers.get("Query.me")).toBeInstanceOf(FieldResolver);
  });
});
