import { createTransformer } from "../src/graphql-transformer";
import { GraphQLTransformer } from "../src/GraphQLTransformer";

describe("createTransformer function", () => {
  it("creates new GraphQLTransformer instance", () => {
    const transformer = createTransformer();
    expect(transformer).toBeDefined();
    expect(transformer).toBeInstanceOf(GraphQLTransformer);
  });
});
