import { createTransformer, GraphQLTransformer } from "../src/transformer";

const schema = /* GraphQL */ `
  type Viewer

  type User @model {
    id: ID!
    firstName: String
    lastName: String
    email: AWSEmail @auth(rules: [{ allow: "owner" }])
    picture: AWSURL
  }

  type Task @model {
    id: ID!
    title: String!
    content: AWSJSON
  }

  extend type Viewer {
    user: User
    tasks: Task @connection
  }
`;

describe("createTransformer function", () => {
  const transformer = createTransformer({ definition: schema });

  it("creates new GraphQLTransformer instance", () => {
    expect(transformer).toBeDefined();
    expect(transformer).toBeInstanceOf(GraphQLTransformer);
  });

  it("transforms schema", () => {
    const result = transformer.transform();
    expect(result.schema).toMatchSnapshot();
  });
});
