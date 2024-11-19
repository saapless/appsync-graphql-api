import { FieldResolver, block, expression, join, statement } from "../../src/resolver";

describe("resolver/FieldResolver", () => {
  const resolver = FieldResolver.create("Query", "node");
  it("should create resolver code", () => {
    resolver
      .addImport("@aws-appsync/utils", { value: "util" })
      .addImport("@aws-appsync/utils/dynamodb", { value: "get" })
      .setRequest(statement("return get({ key: { id: ctx.args.id } })"))
      .setResponse(
        join(
          "\n",
          statement("const { error, result } = ctx"),
          join(" ", "if", expression("error"), block("util.error(error.message, error.type)")),
          statement("return result")
        )
      );

    expect(resolver.print()).toMatchSnapshot();
  });

  describe("given a source", () => {
    const resolver = FieldResolver.create("Query", "node");

    it("parse resolver from source code", () => {
      const fromSource = FieldResolver.fromSource("Query", "user", resolver.print());
      expect(fromSource.isReadonly).toEqual(true);
    });
  });
});
