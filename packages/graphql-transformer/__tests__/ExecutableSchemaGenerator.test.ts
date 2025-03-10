import { beforeAll } from "@jest/globals";
import { TestContext } from "../__fixtures__/TestContext";
import { DocumentNode } from "../src/definition";
import { ExecutableSchemaGenerator } from "../src/plugins";

const schema = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    tasks: Task
  }

  enum UserRole {
    ADMIN
    USER
  }

  type Task {
    id: ID!
    title: String!
    description: String!
    user: User!
  }

  type Query {
    viewer: User
  }
`;

const context = new TestContext({
  document: DocumentNode.fromSource(schema),
  outputDirectory: "__test__",
});

const generator = new ExecutableSchemaGenerator(context, { outDir: "executable-schema" });

describe("ExecutableSchemaGenerator", () => {
  beforeAll(() => {
    for (const node of context.document.definitions.values()) {
      generator.execute(node);
    }
  });

  it("generates executable schema", () => {
    generator.generate();
    expect(context.files.get("executable-schema/schema.ts")).toMatchSnapshot();
  });
});
