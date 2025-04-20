import ts from "typescript";
import { KeyValue, ResolverDescriptor } from "../../context";
import { normalizeWhitespace, printDefinitions } from "../../utils";
import {
  checkEarlyReturn,
  createSortKeyExpression,
  filterQuery,
  formatConnectionResult,
  formatEdgeResult,
  formatEdgesResult,
  formatResult,
  getQueryResult,
  getWhereMethod,
  initBulkGet,
  initCreateItem,
  initDeleteItem,
  initGetItem,
  initQuery,
  initUpdateItem,
  keyValue,
  sortQuery,
} from "./utils";

const resolverDescriptor = {
  typeName: "Query",
  fieldName: "user",
  operation: {
    type: "query",
    key: { eq: "User" },
  },
  targetName: "User",
  returnType: "result",
  authRules: [],
  isEdge: false,
  checkEarlyReturn: false,
} satisfies ResolverDescriptor;

describe("utils", () => {
  describe("getWhereClause", () => {
    it("handles eq", () => {
      expect(getWhereMethod("eq")).toEqual(
        expect.objectContaining({
          escapedText: "equals",
        })
      );
    });

    it("handles ref", () => {
      expect(getWhereMethod("ref")).toEqual(
        expect.objectContaining({
          escapedText: "equals",
        })
      );
    });

    it("handles ne", () => {
      expect(getWhereMethod("ne")).toEqual(
        expect.objectContaining({
          escapedText: "notEqual",
        })
      );
    });
    it("handles gt", () => {
      expect(getWhereMethod("gt")).toEqual(
        expect.objectContaining({
          escapedText: "above",
        })
      );
    });

    it("handles ge", () => {
      expect(getWhereMethod("ge")).toEqual(
        expect.objectContaining({
          escapedText: "aboveOrEqual",
        })
      );
    });

    it("handles lt", () => {
      expect(getWhereMethod("lt")).toEqual(
        expect.objectContaining({
          escapedText: "below",
        })
      );
    });

    it("handles le", () => {
      expect(getWhereMethod("le")).toEqual(
        expect.objectContaining({
          escapedText: "belowOrEqual",
        })
      );
    });

    it("handles between", () => {
      expect(getWhereMethod("between")).toEqual(
        expect.objectContaining({
          escapedText: "between",
        })
      );
    });

    it("handles beginsWith", () => {
      expect(getWhereMethod("beginsWith")).toEqual(
        expect.objectContaining({
          escapedText: "startsWith",
        })
      );
    });

    it("throws error for unknown operator", () => {
      expect(() => getWhereMethod("unknown")).toThrow("Not implemented");
    });
  });

  describe("keyValue", () => {
    it("handles ref object", () => {
      const result = keyValue({ ref: "ref" });
      expect(result.kind).toEqual(ts.SyntaxKind.Identifier);
    });

    it("handles string object", () => {
      const result = keyValue({ eq: "string" });
      expect(result.kind).toEqual(ts.SyntaxKind.StringLiteral);
    });

    it("handles number object", () => {
      const result = keyValue({ eq: 123 });
      expect(result.kind).toEqual(ts.SyntaxKind.NumericLiteral);
    });

    it("throws error for unknown type", () => {
      expect(() => keyValue({ unknown: "value" } as KeyValue)).toThrow("Invalid key value");
    });
  });

  describe("createSortKeyExpression", () => {
    it("creates sort key expression", () => {
      const result = createSortKeyExpression({
        key1: { ref: "ref" },
        key2: { eq: "string" },
        key3: { le: { eq: "string" } },
        key4: { gt: { eq: "string" } },
        key5: { ge: { eq: "string" } },
        key6: { lt: { eq: "string" } },
        key7: { between: [{ eq: "string" }, { eq: "string" }] },
        key8: { beginsWith: { eq: "string" } },
      });

      expect(result.kind).toEqual(ts.SyntaxKind.ObjectLiteralExpression);
      expect(result.properties).toHaveLength(8);
    });
  });

  describe("initQuery", () => {
    it("handles expression without sort key", () => {
      const result = initQuery(resolverDescriptor);
      expect(printDefinitions([result], "test.ts")).toEqual(
        expect.stringContaining('let query = ctx.db.where(":id").equals("User");')
      );
    });

    it("handles expression with sort key", () => {
      const result = initQuery({
        ...resolverDescriptor,
        operation: {
          ...resolverDescriptor.operation,
          sortKey: { eq: "User" },
        },
      });
      expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
        expect.stringContaining(
          `let query = ctx.db.where(":id").equals("User").and(filterExpression({ __typename: { eq: "User" } }));`
        )
      );
    });
  });

  it("creates filterQuery expression", () => {
    const result = filterQuery();
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(
        `if (args.filter) { query = query.filter(filterExpression(args.filter)); }`
      )
    );
  });

  it("creates sortQuery expression", () => {
    const result = sortQuery();
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`if (args.sort === "DESC") { query = query.reverse(); }`)
    );
  });

  it("creates getQueryResult expression", () => {
    const result = getQueryResult();
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`const result = await query.toArray();`)
    );
  });

  it("creates initCreateItem expression", () => {
    const result = initCreateItem(resolverDescriptor);
    expect(result).toHaveLength(5);
  });

  it("creates initGetItem expression", () => {
    const result = initGetItem({
      ...resolverDescriptor,
      operation: {
        ...resolverDescriptor.operation,
        key: { ref: "User" },
      },
    });
    expect(result).toHaveLength(2);
  });

  it("creates initBulkGet expression", () => {
    const result = initBulkGet();
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`const result = await ctx.db.bulkGet(source.keys);`)
    );
  });

  it("creates initUpdateItem expression", () => {
    const result = initUpdateItem();
    expect(result).toHaveLength(4);
  });

  it("creates initDeleteItem expression", () => {
    const result = initDeleteItem();
    expect(result).toHaveLength(3);
  });

  it("create formatConnectionResult expression", () => {
    const result = formatConnectionResult(resolverDescriptor, [], "targetId");
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatConnection({ items: result })`)
    );
  });

  it("create formatConnectionResult expression for edge", () => {
    const result = formatConnectionResult(
      {
        ...resolverDescriptor,
        isEdge: true,
      },
      [],
      "targetId"
    );
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(
        `formatConnection({ items: [], keys: targetId.map(({ targetId }) => targetId).filter(Boolean) })`
      )
    );
  });

  it("creates formatEdgesResult expression", () => {
    const result = formatEdgesResult(resolverDescriptor, [], "result");
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatEdges(result)`)
    );
  });
  it("creates formatEdgeResult expression", () => {
    const result = formatEdgeResult(resolverDescriptor, [], "result");
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatEdge(result)`)
    );
  });

  it("creates formatResult expression for connection", () => {
    const result = formatResult(
      {
        ...resolverDescriptor,
        returnType: "connection",
      },
      []
    );
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatConnection({ items: result })`)
    );
  });

  it("creates formatResult expression for edges", () => {
    const result = formatResult(
      {
        ...resolverDescriptor,
        returnType: "edges",
      },
      []
    );
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatEdges(result)`)
    );
  });

  it("creates formatResult expression for edge", () => {
    const result = formatResult(
      {
        ...resolverDescriptor,
        returnType: "edge",
      },
      [],
      "result"
    );
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`formatEdge(result)`)
    );
  });

  it("creates formatResult expression for result", () => {
    const result = formatResult(resolverDescriptor, []);
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`result`)
    );
  });
  it("creates formatResult expression for default", () => {
    const result = formatResult(resolverDescriptor, []);
    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`result`)
    );
  });

  it("creates checkEarlyReturn expression", () => {
    const result = checkEarlyReturn(resolverDescriptor);

    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`if (source?.user) { return source.user; }`)
    );
  });

  it("creates checkEarlyReturn expression for arrays", () => {
    const result = checkEarlyReturn(resolverDescriptor, true);

    expect(normalizeWhitespace(printDefinitions([result], "test.ts"))).toEqual(
      expect.stringContaining(`if (source?.user && source.user.length) { return source.user; }`)
    );
  });
});
