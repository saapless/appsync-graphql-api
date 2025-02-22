import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { TransformerContext } from "../src/context";
import { DocumentNode } from "../src/definition";
import { ResolverTypesGenerator } from "../src/generators/ResolverTypesGenerator";

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
  beforeAll(() => {
    context.loader.setFieldLoader("Query", "me", {
      targetName: "User",
      action: {
        type: "getItem",
        key: {
          id: { ref: "identity.sub" },
        },
      },
      returnType: "result",
    });
    context.loader.setFieldLoader("Mutation", "createUser", {
      targetName: "User",
      action: {
        type: "putItem",
        key: { id: { ref: "identity.sub" } },
      },
      returnType: "result",
    });
    context.loader.setFieldLoader("Mutation", "updateUser", {
      targetName: "User",
      action: {
        type: "updateItem",
        key: { id: { ref: "identity.sub" } },
      },
      returnType: "result",
    });
    context.loader.setFieldLoader("Mutation", "deleteUser", {
      targetName: "User",
      action: {
        type: "removeItem",
        key: { id: { ref: "args.id" } },
      },
      returnType: "result",
    });
  });

  it("genrates schema types", () => {
    const generator = new ResolverTypesGenerator(context);

    const types = generator.generate("resolver-types.ts");
    expect(types).toMatchSnapshot();
  });
});
