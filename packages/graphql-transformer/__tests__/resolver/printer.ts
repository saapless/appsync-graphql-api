import { printAST, CodeASTNode, NodeKind } from "../../src/resolver/ast";

const ast = {
  kind: NodeKind.CODE_DOCUMENT,
  imports: [
    {
      kind: NodeKind.IMPORT_STATEMENT,
      from: "@aws-appsync/utils",
      named: [
        {
          kind: NodeKind.IMPORT_VALUE,
          value: "Context",
        },
      ],
    },
  ],
  requestFunction: {
    kind: NodeKind.FUNCTION_DEFINITION,
    body: { kind: NodeKind.CODE_BLOCK, value: "return {};" },
    exports: true,
    name: "request",
    parameters: [
      {
        kind: NodeKind.FUNCTION_PARAMETER,
        name: "ctx",
        type: "Context",
      },
    ],
  },
  responseFunction: {
    kind: NodeKind.FUNCTION_DEFINITION,
    body: { kind: NodeKind.CODE_BLOCK, value: "return ctx.result;" },
    exports: true,
    name: "response",
    parameters: [
      {
        kind: NodeKind.FUNCTION_PARAMETER,
        name: "ctx",
        type: "Context",
      },
    ],
  },
} satisfies CodeASTNode;

describe("printAST", () => {
  describe("on FunctionParameter", () => {
    it("print parameter without type", () => {
      const value = printAST({
        kind: NodeKind.FUNCTION_PARAMETER,
        name: "ctx",
      });

      expect(value).toBe("ctx");
    });

    it("print parameter with type", () => {
      const value = printAST({
        kind: NodeKind.FUNCTION_PARAMETER,
        name: "ctx",
        type: "Context",
      });

      expect(value).toBe("ctx: Context");
    });

    it("print parameter with default", () => {
      const value = printAST({
        kind: NodeKind.FUNCTION_PARAMETER,
        name: "value",
        default: "true",
      });

      expect(value).toBe("value = true");
    });
  });

  it("should print the AST", () => {
    const result = printAST(ast);
    expect(result).toMatchSnapshot();
  });
});
