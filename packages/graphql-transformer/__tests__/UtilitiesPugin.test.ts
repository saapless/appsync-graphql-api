import { TransformerContext } from "../src/context";
import { DirectiveDefinitionNode, DocumentNode, ObjectNode } from "../src/definition";
import { UtilitiesPlugin } from "../src/plugins/UtilitiesPlugin";

describe("UtilitiesPlugin", () => {
  const context = new TransformerContext({
    outputDirectory: "__test__",
    document: DocumentNode.fromSource(/* GraphQL */ `
      type Model {
        id: ID!
        name: String!
        read: String @readOnly
        write: String @writeOnly
        client: String @clientOnly
        server: String @serverOnly
      }
    `),
  });

  const plugin = UtilitiesPlugin.create(context);

  beforeAll(() => {
    plugin.before();
  });

  it("adds helper directive definitions", () => {
    expect(context.document.getNode("readOnly")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(context.document.getNode("writeOnly")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(context.document.getNode("clientOnly")).toBeInstanceOf(DirectiveDefinitionNode);
    expect(context.document.getNode("serverOnly")).toBeInstanceOf(DirectiveDefinitionNode);
  });

  it("removes fields and directives on cleanup", () => {
    const model = context.document.getNode("Model") as ObjectNode;
    plugin.cleanup(model);

    expect(model.getField("read")?.hasDirective("readOnly")).toBeFalsy();
    expect(model.getField("client")?.hasDirective("clientOnly")).toBeFalsy();
    expect(model.hasField("write")).toBeFalsy();
    expect(model.hasField("server")).toBeFalsy();
  });

  it("removes helper directives definitions", () => {
    plugin.after();

    expect(context.document.getNode("readOnly")).toBeUndefined();
    expect(context.document.getNode("writeOnly")).toBeUndefined();
    expect(context.document.getNode("writeOnly")).toBeUndefined();
  });
});
