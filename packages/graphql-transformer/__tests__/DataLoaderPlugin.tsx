import path from "node:path";
import { fileURLToPath } from "node:url";
import { TransformerContext } from "../src/context";
import { DirectiveDefinitionNode, DocumentNode, ObjectNode } from "../src/definition";
import { DataLoaderPlugin, FieldResolver } from "../src";
import { TEST_DS_CONFIG } from "../__fixtures__/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const context = new TransformerContext({
  document: DocumentNode.fromSource(/* GraphQL */ `
    type User {
      id: ID!
      name: String!
      js(module: String!): String! @resolver(name: "Node.js", dataSource: "NoneDataSource")
    }

    type Workspace @dataSource(name: "SecondDataSource") {
      id: ID!
      name: String!
    }

    type Query {
      getUser(id: ID!): User!
      user(id: ID!): User! @resolver(name: "Query.getUser")
      workspace: Workspace @resolver(name: "Query.getUser")
    }
  `),
  dataSourceConfig: TEST_DS_CONFIG,
  customResolversSource: path.resolve(__dirname, "../__fixtures__/customResolvers/"),
});

describe("DataLoaderPlugin", () => {
  const plugin = new DataLoaderPlugin(context);

  beforeAll(() => {
    plugin.before();
  });

  it("add directive definitions", () => {
    expect(context.document.getNode("dataSource")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(context.document.getNode("resolver")).toBeInstanceOf(DirectiveDefinitionNode);
  });

  it("creates custom field resolver", () => {
    plugin.execute(context.document.getQueryNode());
    expect(context.resolvers.getFieldResolver("Query", "user")).toBeInstanceOf(FieldResolver);
  });

  it("creates custom field resolver with options", () => {
    plugin.execute(context.document.getNode("User") as ObjectNode);
    const resolver = context.resolvers.getFieldResolver("User", "js");

    expect(resolver).toBeInstanceOf(FieldResolver);
    expect(resolver?.source).toEqual(expect.stringContaining("customResolvers/Node.js.ts"));
    expect(resolver?.dataSource).toBe("NoneDataSource");
  });

  it("creates field resolver with dataSource", () => {
    plugin.execute(context.document.getQueryNode());
    const resolver = context.resolvers.getFieldResolver("Query", "workspace");
    expect(resolver).toBeInstanceOf(FieldResolver);
    expect(resolver?.dataSource).toBe("SecondDataSource");
  });

  it("clean up document objects", () => {
    const queryNode = context.document.getQueryNode();
    const workspaceNode = context.document.getNode("Workspace") as ObjectNode;
    const userNode = context.document.getNode("User") as ObjectNode;

    plugin.cleanup(queryNode);
    plugin.cleanup(workspaceNode);
    plugin.cleanup(userNode);

    expect(queryNode.getField("user")?.hasDirective("resolver")).toBeFalsy();
    expect(queryNode.getField("workspace")?.hasDirective("resolver")).toBeFalsy();
    expect(userNode.getField("js")?.getDirective("resolver")).toBeUndefined();
    expect(workspaceNode.getDirective("dataSource")).toBeUndefined();
  });

  it("clean up schema document", () => {
    plugin.after();
    expect(context.document.getNode("dataSource")).toBeUndefined();
    expect(context.document.getNode("resolver")).toBeUndefined();
  });
});
