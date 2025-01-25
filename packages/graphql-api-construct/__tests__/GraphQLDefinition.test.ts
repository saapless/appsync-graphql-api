import { GraphQLSchema } from "../src/utils/definition";

describe("GraphQLDefinition", () => {
  it("resolves source", () => {
    const schema = GraphQLSchema.fromSource("__tests__/*.graphql");
    expect(schema.definition).not.toHaveLength(0);
  });
});
