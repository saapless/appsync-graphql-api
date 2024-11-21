import { CodeDocument, MemberExpression, NodeKind, printAST, tc } from "../../src/resolver";

describe("resolver code printer", () => {
  describe("ast utilities", () => {
    it("print array definition", () => {
      const ast = tc.const(
        "arr",
        tc.arr(
          tc.str("1"),
          tc.num(2),
          tc.bool(false),
          tc.obj(tc.prop("id", tc.null()), tc.spread("arr")),
          tc.arr()
        )
      );
      expect(printAST(ast)).toEqual(`const arr = ["1", 2, false, { id: null, ...arr }, []]`);
    });
    it("print arrow function statement", () => {
      const ast = tc.arrow(
        [tc.ref("id")],
        tc.ternary(
          tc.eq(tc.ref("id"), tc.str("1")),
          tc.obj(tc.prop("uuid", tc.ref("id"))),
          tc.null()
        )
      );

      expect(printAST(ast)).toEqual(`(id) => id === "1" ? { uuid: id } : null`);
    });
    it("print call expression", () => {
      const ast = tc.let("result", tc.call(tc.ref("getTodo"), tc.ref("id"), true));
      expect(printAST(ast)).toEqual(`let result = getTodo?.(id)`);
    });
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
    it("print for statement", () => {
      const ast = tc.forOf(
        tc.const("item"),
        tc.call(tc.chain("Object.keys"), tc.ref("items")),
        tc.if(tc.ref("item"), tc.return(tc.null()))
      );

      expect(printAST(ast)).toEqual(
        `for (const item of Object.keys(items)) {\n  if (item) {\n    return null\n  }\n}\n`
      );
    });
    it("print function definition", async () => {
      const ast = tc.func(
        "getTodo",
        [tc.ref("id")],
        tc.return(tc.obj(tc.prop("uuid", tc.ref("id"))))
      );

      expect(printAST(ast)).toEqual(`function getTodo(id) {\n  return { uuid: id }\n}\n`);
    });
    it("print if statement", () => {
      const ast = tc.if(
        tc.eq(tc.ref("id"), tc.str("1")),
        tc.return(tc.obj(tc.prop("uuid", tc.ref("id")))),
        tc.return(tc.null())
      );

      expect(printAST(ast)).toEqual(
        `if (id === "1") {\n  return { uuid: id }\n} else {\n  return null\n}\n`
      );
    });
    it("print import statement", () => {
      const ast = tc.import("uuid", tc.named("v4", "uuid"));
      expect(printAST(ast)).toEqual(`import { v4 as uuid } from "uuid";`);
    });
    it("print logical expression", () => {
      const ast = tc.and(tc.ref("id"), tc.or(tc.ref("name"), tc.ref("email")));
      expect(printAST(ast)).toEqual(`id && name || email`);
    });

    it("print switch statement", () => {
      const ast = tc.switch(tc.ref("id"), [
        tc.case(tc.str("1"), [
          tc.assign(tc.ref("uuid"), tc.obj(tc.prop("uuid", tc.ref("id")))),
          tc.break(),
        ]),
        tc.case(null, tc.break()),
      ]);

      expect(printAST(ast)).toEqual(
        `switch (id) {\n  case "1":\n    uuid = { uuid: id }\n    break;\n  default:\n    break;\n}\n`
      );
    });

    it("print ternary expression", () => {
      const ast = tc.ternary(tc.eq(tc.ref("id"), tc.str("1")), tc.ref("id"), tc.null());
      expect(printAST(ast)).toEqual(`id === "1" ? id : null`);
    });
    it("print unary expression", () => {
      expect(printAST(tc.not(tc.ref("id")))).toEqual(`!id`);
      expect(printAST(tc.typeof(tc.ref("id")))).toEqual(`typeof id`);
      expect(printAST(tc.delete(tc.ref("user.id")))).toEqual(`delete user.id`);
    });
    it("print variable definition", () => {
      expect(printAST(tc.const("id", tc.str("1")))).toEqual(`const id = "1"`);
      expect(printAST(tc.let("id", tc.obj({ one: tc.str("1") })))).toEqual(`let id = { one: "1" }`);
      expect(printAST(tc.var("id", tc.arr(tc.str("1"))))).toEqual(`var id = ["1"]`);
    });
    it.todo("print type definition");
    it.todo("print type expression");
  });

  describe("CodeDocument", () => {
    const codeNode = CodeDocument.create();

    codeNode
      .addImport("@aws-appsync/utils", tc.named("util"))
      .addImport("@aws-appsync/utils/dynamodb", tc.namespace("ddb"))
      .addImport("@aws-appsync/utils", tc.named("runtime"))
      .addRequestFunction(
        tc.const(
          tc.obj(tc.prop("args", tc.obj(tc.ref("input"))), tc.ref("identity")),
          tc.ref("ctx")
        ),
        tc.if(
          tc.not(tc.ref("ctx.identity")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), tc.null()))
        ),
        tc.const("id", tc.coalesce(tc.ref("input.id"), tc.call(tc.ref("util.autoId"), []))),
        tc.const(
          "createdAt",
          tc.coalesce(tc.ref("input.createdAt"), tc.call(tc.ref("util.time.nowISO8601"), []))
        ),
        tc.const("updatedAt", tc.coalesce(tc.ref("input.updatedAt"), tc.ref("createdAt"))),
        tc.const(
          "item",
          tc.obj(tc.spread("input"), {
            id: tc.ref("id"),
            createdAt: tc.ref("createdAt"),
            updatedAt: tc.ref("updatedAt"),
            userId: tc.ref("identity.sub"),
            __typename: tc.str("Task"),
            _sk: tc.tick("Task${id}"),
            _version: tc.num(1),
          })
        ),
        tc.return(
          tc.call(
            tc.ref("ddb.put"),
            tc.obj({
              key: tc.obj({ id: tc.ref("item.id") }),
              item: tc.ref("item"),
              condition: tc.obj({
                id: tc.obj({
                  attributeExists: tc.bool(false),
                }),
              }),
            })
          )
        )
      )
      .addResponseFunction(
        tc.const(tc.obj(tc.ref("error"), tc.ref("result")), tc.ref("ctx")),
        tc.if(
          tc.ref("error"),
          tc.call(tc.ref("util.error"), [tc.ref("error.message"), tc.ref("erorr.type")])
        ),
        tc.return(tc.ref("result"))
      );

    describe("imports", () => {
      it("throw when adding default import on exising namespace", () => {
        expect(() =>
          codeNode.addImport("@aws-appsync/utils/dynamodb", tc.default("ddb"))
        ).toThrow();
      });

      it("merges imports", () => {
        const declarations = codeNode
          .serialize()
          .body.filter((node) => node._kind === NodeKind.IMPORT_DECLARATION);

        expect(declarations.length).toEqual(2);
      });
    });

    describe("function", () => {
      it("exports functions", () => {
        const exports = codeNode
          .serialize()
          .body.filter((node) => node._kind === NodeKind.EXPORT_DECLARATION);

        expect(exports.length).toEqual(2);
      });
    });

    it("serialize document ast", () => {
      expect(codeNode.serialize()).toMatchSnapshot();
    });

    it("prints document template", () => {
      expect(codeNode.print()).toMatchSnapshot();
    });
  });
});
