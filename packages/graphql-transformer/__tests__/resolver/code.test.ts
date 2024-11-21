import { MemberExpression, NodeKind, printAST, tc } from "../../src/resolver";

describe("Resolver code compiler", () => {
  describe("the `tc` ast utility", () => {
    it.todo("print array expression");
    it.todo("print arrow function statement");
    it.todo("print call expression");
    it("print chain expression", () => {
      const ast = tc.chain("ctx.args.id");

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
    it.todo("print desctructuring expression");
    it.todo("print export statement");
    it.todo("print for statement");
    it("print function definition", () => {
      const ast = tc.func(
        "getTodo",
        [tc.ref("id")],
        tc.return(tc.obj(tc.prop("uuid", tc.ref("id"))))
      );
      expect(printAST(ast)).toMatchSnapshot();
    });
    it("print if statement", () => {
      const ast = tc.if(
        tc.eq(tc.ref("id"), tc.str("1")),
        tc.return(tc.obj(tc.prop("uuid", tc.ref("id")))),
        tc.return(tc.null())
      );

      expect(printAST(ast)).toMatchSnapshot();
    });
    it.todo("print import statement");
    it.todo("print logical expression");
    it.todo("print object expression");
    it.todo("print switch statement");
    it.todo("print ternary expression");
    it.todo("print type definition");
    it.todo("print type expression");
    it.todo("print unary expression");
    it.todo("print variable definition");
  });

  it.todo("print a code template document");
});
