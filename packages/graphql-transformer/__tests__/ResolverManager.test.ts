import path from "node:path";
import { fileURLToPath } from "node:url";
import { FieldResolver, FunctionResolver, ResolverBase, TransformerContext } from "../src";
import { DocumentNode } from "../src/parser";
import { ResolverManager } from "../src/resolver/ResolverManager";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestResolverManager {
  readonly _fieldResolvers: Map<string, FieldResolver>;
  readonly _pipelineFunctions: Map<string, FunctionResolver>;
  readonly _customResolvers: Map<string, ResolverBase>;
}

describe("ResolverManager", () => {
  describe("with custom resolvers", () => {
    const manager = new ResolverManager(
      new TransformerContext({
        document: DocumentNode.fromSource(/* GraphQL */ `
          type User {
            id: ID!
            name: String!
          }

          type Query {
            getUser(id: ID!): User!
          }
        `),
        defaultDataSourceName: "TestDataSource",
        dataSourceConfig: {
          TestDataSource: {
            type: "DYNAMO_DB",
          },
          NoneDataSource: {
            type: "NONE",
          },
        },
      }),
      { customResolversSource: path.resolve(__dirname, "../__fixtures__/customResolvers/") }
    ) as unknown as TestResolverManager;

    it("stash custom defined resolvers", () => {
      expect(manager._customResolvers.size).toBe(2);
    });

    it("creates field resolver", () => {
      expect(manager._fieldResolvers.size).toBe(1);
      expect(manager._fieldResolvers.get("Query.getUser")).toBeInstanceOf(FieldResolver);
    });
  });
});
