import { createTransformer, GraphQLTransformer } from "../src/transformer";

const schema = /* GraphQL */ `
  type Task implements Node @model {
    id: ID!
    title: String!
  }
`;

describe("createTransformer function", () => {
  const transformer = createTransformer({ definition: schema });

  it("creates new GraphQLTransformer instance", () => {
    expect(transformer).toBeDefined();
    expect(transformer).toBeInstanceOf(GraphQLTransformer);
  });

  it("transforms schema", () => {
    const result = transformer.transform();
    expect(result.schema).toMatchSnapshot();
  });
});
