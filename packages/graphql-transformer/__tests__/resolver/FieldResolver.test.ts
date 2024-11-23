import { FieldResolver, tc } from "../../src/resolver";

describe("resolver/FieldResolver", () => {
  const resolver = FieldResolver.create("Query", "node");
  it("should create resolver code", () => {
    resolver
      .addImport("@aws-appsync/utils", "util")
      .addImport("@aws-appsync/utils/dynamodb", "get")
      .setStage("INIT", tc.call(tc.ref("console.log"), [tc.ref("ctx")]))
      .setStage(
        "LOAD",
        tc.return(
          tc.call(tc.ref("get"), [
            tc.obj(tc.prop("key", tc.obj(tc.prop("id", tc.chain("ctx.args.id"))))),
          ])
        )
      );

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
