import { TEST_DS_CONFIG } from "../__fixtures__/constants";
import { TransformerContext } from "../src/context";
import { DocumentNode } from "../src/definition";
import { SchemaTypesGenerator } from "../src/generators";

const context = new TransformerContext({
  document: DocumentNode.fromSource(/* GraphQL */ `
    type User @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      name: String!
      tasks: Task @hasMany
    }

    type Task @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      name: String!
      user: User
    }

    type CreateTaskInput {
      name: String!
      userId: ID!
    }

    type UpdateTaskInput {
      id: ID!
      name: String!
    }

    type Mutation {
      createTask(input: CreateTaskInput!): Task
      updateTask(input: UpdateTaskInput!): Task
      deleteTask(id: ID!): Task
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
