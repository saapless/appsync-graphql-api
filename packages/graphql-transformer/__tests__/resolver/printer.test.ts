import { printAST, DocumentDefinition, NodeKind, _literal } from "../../src/resolver";

const ast = {
  _kind: NodeKind.CODE_DOCUMENT,
  body: [
    {
      _kind: NodeKind.IMPORT_DECLARATION,
      from: "@aws-appsync/utils",
      specifiers: [
        {
          _kind: NodeKind.MODULE_NAMED_SPECIFIER,
          value: {
            _kind: NodeKind.LITERAL,
            value: "Context",
            type: "string",
          },
        },
      ],
    },
  ],
  // requestFunction: {
  //   kind: NodeKind.FUNCTION_DEFINITION,
  //   body: { kind: NodeKind.CODE_BLOCK, value: "return {};" },
  //   exports: true,
  //   name: "request",
  //   parameters: [
  //     {
  //       kind: NodeKind.FUNCTION_PARAMETER,
  //       name: "ctx",
  //       type: "Context",
  //     },
  //   ],
  // },
  // responseFunction: {
  //   kind: NodeKind.FUNCTION_DEFINITION,
  //   body: { kind: NodeKind.CODE_BLOCK, value: "return ctx.result;" },
  //   exports: true,
  //   name: "response",
  //   parameters: [
  //     {
  //       kind: NodeKind.FUNCTION_PARAMETER,
  //       name: "ctx",
  //       type: "Context",
  //     },
  //   ],
  // },
} satisfies DocumentDefinition;

describe("printAST", () => {
  describe("on FunctionParameter", () => {
    it("print parameter without type", () => {
      const value = printAST(_literal("ctx"));

      expect(value).toBe("ctx");
    });

    // it("print parameter with type", () => {
    //   const value = printAST({
    //     kind: NodeKind.FUNCTION_PARAMETER,
    //     name: "ctx",
    //     type: "Context",
    //   });

    //   expect(value).toBe("ctx: Context");
    // });

    // it("print parameter with default", () => {
    //   const value = printAST({
    //     kind: NodeKind.FUNCTION_PARAMETER,
    //     name: "value",
    //     default: "true",
    //   });

    //   expect(value).toBe("value = true");
    // });
  });

  it("should print the AST", () => {
    const result = printAST(ast);
    expect(result).toMatchSnapshot();
  });
});
