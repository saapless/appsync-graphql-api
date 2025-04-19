import { Kind, ObjectTypeDefinitionNode, ObjectTypeExtensionNode } from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { FieldNode } from "./FieldNode";
import { ObjectNode } from "./ObjectNode";
import { NamedTypeNode } from "./TypeNode";

const definition = {
  kind: Kind.OBJECT_TYPE_DEFINITION,
  name: {
    kind: Kind.NAME,
    value: "Test",
  },
  fields: [
    {
      kind: Kind.FIELD_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: "id",
      },
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: "ID",
        },
      },
    },
  ],
  interfaces: [
    {
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: "Node",
      },
    },
  ],
  directives: [
    {
      kind: Kind.DIRECTIVE,
      name: {
        kind: Kind.NAME,
        value: "auth",
      },
    },
  ],
} as const satisfies ObjectTypeDefinitionNode;

describe("ObjectNode", () => {
  it("creates node from values", () => {
    const node = ObjectNode.create(
      "Test",
      [FieldNode.create("id", NamedTypeNode.create("ID"))],
      [NamedTypeNode.create("Node")],
      [DirectiveNode.create("auth")]
    );

    expect(node).toBeInstanceOf(ObjectNode);
    expect(node.name).toEqual("Test");
  });

  it("creates node from definition", () => {
    const node = ObjectNode.fromDefinition(definition);

    expect(node).toBeInstanceOf(ObjectNode);
    expect(node.name).toEqual("Test");
  });

  it("extends interface", () => {
    const node = ObjectNode.create("Test");

    node.extend({
      ...definition,
      kind: Kind.OBJECT_TYPE_EXTENSION,
    } as const satisfies ObjectTypeExtensionNode);

    expect(node.hasField("id")).toEqual(true);
    expect(node.hasInterface("Node")).toEqual(true);
    expect(node.hasDirective("auth")).toEqual(true);
  });

  it("serializes node", () => {
    const node = ObjectNode.create(
      "Test",
      [FieldNode.create("id", NamedTypeNode.create("ID"))],
      [NamedTypeNode.create("Node")],
      [DirectiveNode.create("auth")]
    );

    const serializedDefinition = node.serialize();
    expect(serializedDefinition).toEqual(expect.objectContaining(definition));
  });
});
