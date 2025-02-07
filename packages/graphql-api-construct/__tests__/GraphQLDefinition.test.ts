import { GraphQLSchema } from "../src/utils/definition";

describe("GraphQLDefinition", () => {
  it("resolves source", () => {
    const schema = GraphQLSchema.fromString(/* GraphQL */ `
      type User {
        id: ID!
        name: String!
      }
    `);

    expect(schema.definition).not.toHaveLength(0);
  });
});
