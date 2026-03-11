import { jest } from "@jest/globals";
import { TestTransformerContext } from "../utils/test-utils";
import { DocumentNode } from "../definition";
import { SchemaTypesGenerator } from "./SchemaTypesGenerator";

const context = new TestTransformerContext({
  outputDirectory: "__test__",
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

describe("SchemaTypesGenerator", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("generates schema types", async () => {
    const generator = new SchemaTypesGenerator(context);
    generator.generate();
    expect(context.files.get("schema-types.ts")).toMatchInlineSnapshot(`""`);
  });
});
