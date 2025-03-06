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
      action: {
        type: "getItem",
        key: {
          id: { ref: "identity.sub" },
        },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "createUser", {
      targetName: "User",
      action: {
        type: "putItem",
        key: { id: { ref: "identity.sub" } },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "updateUser", {
      targetName: "User",
      action: {
        type: "updateItem",
        key: { id: { ref: "identity.sub" } },
      },
      returnType: "result",
    });
    context.resolvers.setLoader("Mutation", "deleteUser", {
      targetName: "User",
      action: {
        type: "removeItem",
        key: { id: { ref: "args.id" } },
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
