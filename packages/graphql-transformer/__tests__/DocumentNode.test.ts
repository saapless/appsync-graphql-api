import { print } from "graphql";
import {
  DirectiveNode,
  DocumentNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../src/parser";

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

  type Query {
    hello: String
  }
`;

describe("DocumentNode parser", () => {
  const documentNode = DocumentNode.fromSource(schema);

  it("should parse document node", () => {
    const queryNode = documentNode.getNode("Query");
    expect(queryNode).toBeDefined();
    expect(queryNode).toBeInstanceOf(ObjectNode);
  });

  it("should serialize document", () => {
    const serialized = documentNode.serialize();
    expect(print(serialized)).toMatchSnapshot();
  });

  it("should add nodes", () => {
    const nodeInterface = InterfaceNode.create("Node", [
      FieldNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))),
    ]);

    documentNode.addNode(nodeInterface);

    const queryNode = documentNode.getNode("Query");

    if (queryNode instanceof ObjectNode) {
      queryNode.addField(
        FieldNode.create(
          "node",
          NamedTypeNode.create("Node"),
          [InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID")))],
          [DirectiveNode.create("auth")]
        )
      );
    }

    expect(print(documentNode.serialize())).toMatchSnapshot();
  });
});
