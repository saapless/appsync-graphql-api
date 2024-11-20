import {
  _call,
  _chain,
  _export,
  _func,
  _id,
  _obj,
  _prop,
  _return,
  MemberExpression,
  NodeKind,
  printAST,
} from "../../src/resolver";

describe("template ast parser", () => {
  describe("utility functions", () => {
    it("_chain => build MemberExpression", () => {
      const ast = _chain("ctx.args.id");

      expect(ast).toEqual({
        _kind: NodeKind.MEMBER_EXPRESSION,
        object: {
          _kind: NodeKind.MEMBER_EXPRESSION,
          object: {
            _kind: NodeKind.IDENTIFIER,
            name: "ctx",
          },
          property: {
            _kind: NodeKind.IDENTIFIER,
            name: "args",
          },
          computed: false,
          optional: false,
        },
        property: {
          _kind: NodeKind.IDENTIFIER,
          name: "id",
        },
        computed: false,
        optional: false,
      } satisfies MemberExpression);
    });

    it("create function declaration ast", () => {
      const ast = _export(
        _func(
          "request",
          [_id("ctx")],
          _return(_call(_id("get"), [_obj(_prop("key", _obj(_prop("id", _chain("ctx.args.id")))))]))
        )
      );

      expect(ast).toMatchSnapshot();
      expect(printAST(ast)).toMatchSnapshot();
    });
  });
});
