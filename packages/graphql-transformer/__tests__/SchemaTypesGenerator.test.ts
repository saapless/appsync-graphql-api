import { jest } from "@jest/globals";
import { DocumentNode } from "../src/definition";
import { TestContext } from "../__fixtures__/TestContext";

const { SchemaTypesGenerator } = await import("../src/plugins/SchemaTypesGenerator");

const context = new TestContext({
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
    expect(context.files.get("schema-types.ts")).toMatchSnapshot();
  });
});
