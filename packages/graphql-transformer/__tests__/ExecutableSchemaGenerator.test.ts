import path from "node:path";
import { createTransformer } from "../src";
import { dirname } from "../src/utils";
import { ExecutableSchemaGenerator } from "../src/plugins/ExecutableSchemaGenerator";

const definition = /* GraphQL */ `
  type User @model {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    tasks: Task @hasMany
  }

  enum UserRole {
    ADMIN
    USER
  }

  type Task @model {
    id: ID!
    title: String!
    description: String!
    user: User! @hasOne
  }

  type Query {
    viewer: User
  }
`;

const output = path.resolve(dirname(import.meta.url), "../__generated__");

const transformer = createTransformer({
  definition,
  outDir: output,
  plugins: [ExecutableSchemaGenerator],
  modelOperationsConfig: {
    defaultModelOperations: ["write"],
  },
});

describe("ExecutableSchemaGenerator", () => {
  it("generates executable schema", () => {
    const result = transformer.transform();

    expect(result.schema).toMatchSnapshot();
  });
});
