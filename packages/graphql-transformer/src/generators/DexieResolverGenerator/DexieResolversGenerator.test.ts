import { ResolverDescriptor } from "../../context";
import { DocumentNode } from "../../definition";
import { printDefinitions } from "../../utils";
import { TestTransformerContext } from "../../utils/test-utils";
import { DexieResolverGenerator } from "./DexieResolversGenerator";

const context = new TestTransformerContext({
  document: DocumentNode.fromSource(/* GraphQL */ `
    type User {
      id: ID
      name: String
    }

    type Query {
      getUser(id: ID!): User
    }
  `),
  outputDirectory: "__tests__",
});

const descriptor = {
  typeName: "Query",
  fieldName: "getUser",
  operation: {
    type: "get",
    key: { ref: "args.id" },
  },
  returnType: "result",
  targetName: "User",
  checkEarlyReturn: true,
} satisfies ResolverDescriptor;

const generator = new DexieResolverGenerator(context, []);

describe("DexieResolversGenerator", () => {
  it("genrates get resolver function", () => {
    const result = generator.generate(descriptor);

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`await ctx.db.get(args.id);`)
    );
  });

  it("genrates batchGet resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "batchGet",
        key: { ref: "args.ids" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`await ctx.db.bulkGet(source.keys)`)
    );
  });

  it("generates query resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "query",
        key: { eq: "User" },
        index: "__typename",
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`ctx.db.where("__typename").equals("User")`)
    );
  });

  it("generates query resolver function on primary table", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "query",
        key: { eq: "User" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`ctx.db.where(":id").equals("User")`)
    );
  });

  it("throws when index is invalid", () => {
    expect(() =>
      generator.generate({
        ...descriptor,
        operation: {
          type: "query",
          key: { eq: "User" },
          index: "invalidIndex",
        },
      })
    ).toThrow(`invalidIndex not found in index mappings`);
  });

  it("generates create resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "create",
        key: { ref: "args.input.id" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`await ctx.db.add(values);`)
    );
  });

  it("generates update resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "update",
        key: { ref: "args.input.id" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`await ctx.db.update(id`)
    );
  });
  it("generates upsert resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "upsert",
        key: { ref: "args.input.id" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(expect.stringContaining(`return result`));
  });

  it("generates delete resolver function", () => {
    const result = generator.generate({
      ...descriptor,
      operation: {
        type: "delete",
        key: { ref: "args.input.id" },
      },
    });

    expect(printDefinitions([result], "test.ts")).toEqual(
      expect.stringContaining(`await ctx.db.delete(record.id);`)
    );
  });

  it("throws error for unknown operation type", () => {
    expect(() =>
      generator.generate({
        ...descriptor,
        operation: {
          type: "getItem",
          key: { ref: "args.input.id" },
        },
      } as unknown as ResolverDescriptor)
    ).toThrow(`Unknown action type: getItem`);
  });
});
