import { createTransformer, GraphQLTransformer } from "../src/transformer";
import { FieldResolver } from "../src/resolver";

const schema = /* GraphQL */ `
  type Viewer

  interface Node {
    id: ID!

    # Metadata
    createdAt: AWSDateTime
    updatedAt: AWSDateTime
    _version: Int
    _deleted: Boolean
  }

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
    const schema = result.document.print();
    const nodeResolver = result.resolvers.get("Query.node");

    expect(schema).toMatchSnapshot();
    expect(nodeResolver).toBeInstanceOf(FieldResolver);
    expect(nodeResolver?.print()).toMatchSnapshot();
  });
});
