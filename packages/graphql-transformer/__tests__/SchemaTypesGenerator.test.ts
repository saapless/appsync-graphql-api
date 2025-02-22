import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { TransformerContext } from "../src/context";
import { DocumentNode } from "../src/definition";
import { SchemaTypesGenerator } from "../src/generators";

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
  dataSourceConfig: TEST_DS_CONFIG,
});

describe("SchemaTypesGenerator", () => {
  it("genrates schema types", () => {
    const generator = new SchemaTypesGenerator(context);

    const types = generator.generate("schema-types.ts");
    expect(types).toMatchSnapshot();
  });
});
