import { FieldResolver, _call, _chain, _id, _obj, _prop, _return } from "../../src/resolver";

describe("resolver/FieldResolver", () => {
  const resolver = FieldResolver.create("Query", "node");
  it("should create resolver code", () => {
    resolver
      .addImport("@aws-appsync/utils", "util")
      .addImport("@aws-appsync/utils/dynamodb", "get")
      .setRequest(
        _return(_call(_id("get"), [_obj(_prop("key", _obj(_prop("id", _chain("ctx.args.id")))))]))
      );

    expect(resolver.serialize()).toMatchSnapshot();
  });

  describe("given a source", () => {
    it("parse resolver from source code", () => {
      const fromSource = FieldResolver.fromSource("Query", "user", "function request() {}");
      expect(fromSource.isReadonly).toEqual(true);
    });
  });
});
