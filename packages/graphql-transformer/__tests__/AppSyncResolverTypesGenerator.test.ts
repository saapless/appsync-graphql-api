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

const { AppSyncResolverTypesGenerator } = await import(
  "../src/plugins/AppSyncResolverTypesGenerator"
);

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
    expect(outputContent).toMatchSnapshot();
  });
});
