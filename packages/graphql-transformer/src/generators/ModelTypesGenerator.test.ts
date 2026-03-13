import { jest } from "@jest/globals";
import { TestTransformerContext } from "../utils/test-utils";
import { DocumentNode, InputObjectNode, ObjectNode } from "../definition";
import { ModelTypesGenerator } from "./ModelTypesGenerator";

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

describe("ModelTypesGenerator", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("generates schema types", async () => {
    const generator = new ModelTypesGenerator(context);
    generator.before();
    generator.execute(context.document.getNode("User") as ObjectNode);
    generator.execute(context.document.getNode("CreateUserInput") as InputObjectNode);
    generator.execute(context.document.getNode("UpdateUserInput") as InputObjectNode);
    generator.generate();

    expect(context.files.get("schema-types.ts")).toMatchInlineSnapshot(`
"export type Maybe<T> = T | null | undefined;
export type User = {
    id: string;
    name: string;
};
export type CreateUserInput = {
    id?: Maybe<string>;
    name?: Maybe<string>;
};
export type UpdateUserInput = {
    id: string;
    name?: Maybe<string>;
};
"
`);
  });
});
