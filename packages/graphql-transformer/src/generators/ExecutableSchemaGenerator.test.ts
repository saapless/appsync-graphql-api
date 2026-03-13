import { beforeAll } from "@jest/globals";
import { DocumentNode } from "../definition";
import { TestTransformerContext } from "../utils/test-utils";
import { ExecutableSchemaGenerator } from "./ExecutableSchemaGenerator";

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

const context = new TestTransformerContext({
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
    expect(context.files.get("executable-schema/schema.ts")).toMatchInlineSnapshot(`
"/* eslint-disable */
import { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLEnumType, GraphQLSchema } from "graphql";
let User: GraphQLObjectType<Schema.User, ResolverContext>;
let Task: GraphQLObjectType<Schema.Task, ResolverContext>;
let Query: GraphQLObjectType<undefined, ResolverContext>;
const UserRole = new GraphQLEnumType({ name: "UserRole", values: { ADMIN: { value: "ADMIN" }, USER: { value: "USER" } } });
Task = new GraphQLObjectType({ name: "Task", fields: () => ({ id: { type: new GraphQLNonNull(GraphQLID) }, title: { type: new GraphQLNonNull(GraphQLString) }, description: { type: new GraphQLNonNull(GraphQLString) }, user: { type: new GraphQLNonNull(User) } }) });
User = new GraphQLObjectType({ name: "User", fields: () => ({ id: { type: new GraphQLNonNull(GraphQLID) }, name: { type: new GraphQLNonNull(GraphQLString) }, email: { type: new GraphQLNonNull(GraphQLString) }, role: { type: new GraphQLNonNull(UserRole) }, tasks: { type: Task } }) });
Query = new GraphQLObjectType({ name: "Query", fields: () => ({ viewer: { type: User } }) });
export const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    types: [User, UserRole, Task]
});
"
`);
  });
});
