import path from "node:path";
import { fileURLToPath } from "node:url";
import { TransformerContext } from "../src/context";
import { FieldResolver, FunctionResolver, ResolverBase } from "../src/resolver";
import { DocumentNode } from "../src/definition";
import { ResolverManager } from "../src/resolver/ResolverManager";
import { TEST_DS_CONFIG } from "../__fixtures__/constants";

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
        dataSourceConfig: TEST_DS_CONFIG,
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
