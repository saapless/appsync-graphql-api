import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { TransformerContext } from "../src/context";
import {
  DirectiveDefinitionNode,
  DocumentNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  ObjectNode,
} from "../src/definition";
import { ConnectionPlugin } from "../src/plugins";

const schema = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
  }

  type Todo {
    id: ID
    content: String
    resources: Resource @hasMany
  }

  type Document {
    url: String!
  }

  type Message {
    content: String!
  }

  union Resource = Document | Message

  type Query {
    me: User @hasOne(key: { ref: "identity.sub" })
    todos: Todo
      @hasMany(
        key: { ref: "identity.sub" }
        sortKey: { beginsWith: { eq: "Todo" } }
        index: "bySourceId"
      )
  }
`;

describe("ConnectionPlugin", () => {
  const context = new TransformerContext({
    document: DocumentNode.fromSource(schema),
    dataSourceConfig: TEST_DS_CONFIG,
  });

  const plugin = ConnectionPlugin.create(context);

  describe("on run `before` hook", () => {
    beforeAll(() => plugin.before());

    it("adds connection directive definitions", () => {
      expect(context.document.getNode("ConnectionRelationType")).toBeInstanceOf(EnumNode);
      expect(context.document.getNode("SortKeyInput")).toBeInstanceOf(InputObjectNode);
      expect(context.document.getNode("hasOne")).toBeInstanceOf(DirectiveDefinitionNode);
      expect(context.document.getNode("hasMany")).toBeInstanceOf(DirectiveDefinitionNode);
    });

    it("adds scalars filter types", () => {
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

  describe("on normalize node", () => {
    beforeAll(() => {
      plugin.normalize(context.document.getQueryNode());
      plugin.normalize(context.document.getNode("Todo") as ObjectNode);
    });

    it("adds connection keys to nodes", () => {
      expect((context.document.getNode("Todo") as ObjectNode).getField("sourceId")).toBeInstanceOf(
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
      expect(resourcesField?.getArgument("filter")?.type.getTypeName()).toBe(
        "ResourceEdgeFilterInput"
      );
      expect(resourcesField?.hasArgument("first")).toBe(true);
      expect(resourcesField?.hasArgument("after")).toBe(true);
      expect(resourcesField?.hasArgument("sort")).toBe(true);
    });

    it("creates field resolvers", () => {
      expect(context.loader.hasFieldLoader("Todo.resources")).toStrictEqual(true);
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

      expect(queryNode.getField("me")?.hasDirective("hasOne")).toBeFalsy();
      expect(queryNode.getField("todos")?.hasDirective("hasMany")).toBeFalsy();
      expect(todoNode.getField("resources")?.hasDirective("hasMany")).toBeFalsy();
    });
  });

  describe("on run `after` hook", () => {
    beforeAll(() => {
      plugin.after();
    });

    it("removes connection directive definitions", () => {
      expect(context.document.getNode("ConnectionRelationType")).toBeUndefined();
      expect(context.document.getNode("SortKeyInput")).toBeUndefined();
      expect(context.document.getNode("edges")).toBeUndefined();
      expect(context.document.getNode("node")).toBeUndefined();
    });
  });

  it("matches snapshot", () => {
    expect(context.document.print()).toMatchSnapshot();
  });
});
