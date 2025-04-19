import { Kind, ScalarTypeDefinitionNode, ScalarTypeExtensionNode } from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { ScalarNode } from "./ScalarNode";

const definition = {
  kind: Kind.SCALAR_TYPE_DEFINITION,
  name: {
    kind: Kind.NAME,
    value: "DateTime",
  },
  directives: [
    {
      kind: Kind.DIRECTIVE,
      name: {
        kind: Kind.NAME,
        value: "testOnly",
      },
    },
  ],
} as const satisfies ScalarTypeDefinitionNode;

describe("ScalarNode", () => {
  it("create node from value", () => {
    const node = ScalarNode.create("DateTime", [DirectiveNode.create("testOnly")]);
    expect(node).toBeInstanceOf(ScalarNode);
    expect(node.hasDirective("testOnly")).toEqual(true);
  });

  it("creates node from definition", () => {
    const node = ScalarNode.fromDefinition(definition);

    expect(node).toBeInstanceOf(ScalarNode);
    expect(node.name).toEqual("DateTime");
  });

  it("extends scalar", () => {
    const node = ScalarNode.create("DateTime");

    node.extend({
      ...definition,
      kind: Kind.SCALAR_TYPE_EXTENSION,
    } as const satisfies ScalarTypeExtensionNode);

    expect(node.hasDirective("testOnly")).toEqual(true);
  });

  it("serializes node", () => {
    const node = ScalarNode.create("DateTime", [DirectiveNode.create("testOnly")]);

    const serializedDefinition = node.serialize();
    expect(serializedDefinition).toEqual(expect.objectContaining(definition));
  });
});
