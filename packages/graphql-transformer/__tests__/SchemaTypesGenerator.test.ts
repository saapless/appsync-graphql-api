import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { TransformerContext } from "../src/context";
import { DocumentNode } from "../src/definition";
import { SchemaTypesGenerator } from "../src/generators/SchemaTypesGenerator";
import { ensureOutputDirectory } from "../src/utils";

const context = new TransformerContext({
  document: DocumentNode.fromSource(/* GraphQL */ `
    type User {
      id: ID!
      name: String!
    }

    input CreateUserInput {
      id: ID
      name: String
    }

    input UpdateUserInput {
      id: ID!
      name: String
    }

    type Query {
      me: User
    }

    type Mutation {
      createUser(input: CreateUserInput!): User
      updateUser(input: UpdateUserInput!): User
      deleteUser(id: ID!): User
    }
  `),
});

const outDir = ensureOutputDirectory(
  resolve(dirname(fileURLToPath(import.meta.url)), "../__generated__")
);

describe("SchemaTypesGenerator", () => {
  it("genrates schema types", async () => {
    const generator = new SchemaTypesGenerator(context);
    generator.beforeCleanup(outDir);

    const file = await readFile(resolve(outDir, "schema-types.ts"), "utf-8");
    expect(file).toMatchSnapshot();
  });
});
