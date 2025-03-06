import { jest } from "@jest/globals";
import { DocumentNode } from "../src/definition";
import { TestContext } from "../__fixtures__/TestContext";
import { AppSyncResolverTypesGenerator } from "../src/plugins/AppSyncResolverTypesGenerator";

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

describe("AppSyncResolverTypesGenerator", () => {
  beforeAll(() => {
    context.resolvers.setLoader("Query", "me", {
      targetName: "User",
      operation: {
        type: "get",
        key: { ref: "identity.sub" },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "createUser", {
      targetName: "User",
      operation: {
        type: "create",
        key: { ref: "identity.sub" },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "updateUser", {
      targetName: "User",
      operation: {
        type: "update",
        key: { ref: "identity.sub" },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "deleteUser", {
      targetName: "User",
      operation: {
        type: "delete",
        key: { ref: "args.id" },
      },
      returnType: "result",
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it("generates resolver context types", async () => {
    const generator = new AppSyncResolverTypesGenerator(context);

    generator.generate();
    expect(context.files.get("resolver-types.ts")).toMatchSnapshot();
  });
});
