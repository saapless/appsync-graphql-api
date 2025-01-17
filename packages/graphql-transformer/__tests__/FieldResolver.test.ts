import { FieldResolver } from "../src/resolver";

describe("resolver/FieldResolver", () => {
  const resolver = FieldResolver.create("Query", "node");
  it("should create resolver code", () => {
    const { code } = resolver.serialize();
    expect(code).toMatchSnapshot();
  });

  describe("given a source", () => {
    it("parse resolver from source code", () => {
      const fromSource = FieldResolver.fromSource("Query", "user", "function request() {}");
      expect(fromSource.isReadonly).toEqual(true);
    });
  });
});
