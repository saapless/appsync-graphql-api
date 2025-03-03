import { jest } from "@jest/globals";
import { TransformerContext } from "../src/context";
import { DocumentNode } from "../src/definition";

let outputContent = "";

jest.unstable_mockModule("node:fs", () => {
  return {
    default: {
      writeFileSync: jest.fn().mockImplementation((path, content) => {
        outputContent = content as string;
      }),
    },
  };
});

const { SchemaTypesGenerator } = await import("../src/plugins/SchemaTypesGenerator");

const context = new TransformerContext({
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

  it("genrates schema types", async () => {
    const generator = new SchemaTypesGenerator(context);
    generator.generate();
    expect(outputContent).toMatchSnapshot();
  });
});
