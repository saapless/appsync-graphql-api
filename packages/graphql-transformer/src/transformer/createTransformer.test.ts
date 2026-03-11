import { jest } from "@jest/globals";
import { createTransformer } from "./createTransformer";
import { GraphQLTransformer } from "./GraphQLTransformer";

jest.unstable_unmockModule("../context");

const transformer = createTransformer({
  definition: /* GraphQL */ `
    type Query {
      viewer: Viewer!
    }
  `,
});

describe("createTransformer", () => {
  it("throws if empty definition", () => {
    expect(() => createTransformer({ definition: "" })).toThrow();
  });

  it("creates new GraphQLTransformer instance", () => {
    expect(transformer).toBeDefined();
    expect(transformer).toBeInstanceOf(GraphQLTransformer);
  });

  it("adds default plugins list", () => {
    expect(transformer.plugins).toHaveLength(4);
  });
});
