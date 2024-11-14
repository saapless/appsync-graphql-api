import { print } from "graphql";
import {
  DirectiveNode,
  DocumentNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  ObjectNode,
} from "../src/parser";
import { TypeNode } from "../src/parser/TypeNode";

const schema = /* GraphQL */ `
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
      FieldNode.create("id", TypeNode.create("ID", false)),
    ]);

    documentNode.addNode(nodeInterface);

    const queryNode = documentNode.getNode("Query");

    if (queryNode instanceof ObjectNode) {
      queryNode.addField(
        FieldNode.create(
          "node",
          TypeNode.create("Node"),
          [InputValueNode.create("id", TypeNode.create("ID", false))],
          [DirectiveNode.create("auth")]
        )
      );
    }

    expect(print(documentNode.serialize())).toMatchSnapshot();
  });
});
