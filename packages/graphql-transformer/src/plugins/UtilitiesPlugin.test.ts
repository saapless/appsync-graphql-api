import { TransformerContext } from "../context";
import { FieldNode, ObjectNode } from "../definition";
import { DocumentNode } from "../definition/DocumentNode";
import { TestTransformerContext } from "../utils/test-utils";
import { UtilitiesPlugin, UtilityDirective } from "./UtilitiesPlugin";

describe("UtilitiesPlugin", () => {
  let plugin: UtilitiesPlugin;
  let context: TransformerContext;

  beforeAll(() => {
    context = new TestTransformerContext({
      outputDirectory: "__test__",
      document: DocumentNode.fromSource(/* GraphQL */ `
        type User {
          id: ID!
          username: String @semanticNonNull
          email: String @nonNull(on: { read: true })
          tags: [String] @nonNull(levels: [0, 1])
        }
        type Query {
          test: String
        }
      `),
    });

    plugin = UtilitiesPlugin.create(context);
  });

  it("adds utility directive definitions", () => {
    plugin.before();

    expect(context.document.getNode(UtilityDirective.READ_ONLY)).toBeDefined();
    expect(context.document.getNode(UtilityDirective.WRITE_ONLY)).toBeDefined();
    expect(context.document.getNode(UtilityDirective.SERVER_ONLY)).toBeDefined();
    expect(context.document.getNode(UtilityDirective.CLIENT_ONLY)).toBeDefined();
    expect(context.document.getNode(UtilityDirective.FILTER_ONLY)).toBeDefined();
    expect(context.document.getNode(UtilityDirective.NON_NULL)).toBeDefined();
    expect(context.document.getNode("NonNullOptionsInput")).toBeDefined();
  });

  it("normalizes fields with @nonNull directive", () => {
    const userNode = context.document.getNode("User") as ObjectNode;
    plugin.normalize(userNode);

    const emailField = userNode.getField("email") as FieldNode;
    const emailFieldDirective = emailField.getDirective(UtilityDirective.SEMANTIC_NON_NULL);

    expect(emailFieldDirective).toBeDefined();
    expect(emailFieldDirective?.hasArgument("levels")).toBe(false);

    const tagsField = userNode.getField("tags") as FieldNode;
    const tagsFieldDirective = tagsField.getDirective(UtilityDirective.SEMANTIC_NON_NULL);

    expect(tagsFieldDirective).toBeDefined();
    expect(tagsFieldDirective?.hasArgument("levels")).toBe(true);
    expect(tagsFieldDirective?.getArgument("levels")?.toJSON()).toEqual({ levels: [0, 1] });
  });

  it("cleans up utility directives", () => {
    const userNode = context.document.getNode("User") as ObjectNode;
    plugin.cleanup(userNode);

    expect(userNode.getField("username")?.hasDirective(UtilityDirective.SEMANTIC_NON_NULL)).toBe(
      true
    );
    expect(userNode.getField("email")?.hasDirective(UtilityDirective.NON_NULL)).toBe(false);
    expect(userNode.getField("email")?.hasDirective(UtilityDirective.SEMANTIC_NON_NULL)).toBe(true);
    expect(userNode.getField("tags")?.hasDirective(UtilityDirective.NON_NULL)).toBe(false);
    expect(userNode.getField("tags")?.hasDirective(UtilityDirective.SEMANTIC_NON_NULL)).toBe(true);
  });

  it("removes utility directive definitions on after hook", () => {
    plugin.after();

    expect(context.document.getNode(UtilityDirective.READ_ONLY)).toBeUndefined();
    expect(context.document.getNode(UtilityDirective.WRITE_ONLY)).toBeUndefined();
    expect(context.document.getNode(UtilityDirective.SERVER_ONLY)).toBeUndefined();
    expect(context.document.getNode(UtilityDirective.CLIENT_ONLY)).toBeUndefined();
    expect(context.document.getNode(UtilityDirective.FILTER_ONLY)).toBeUndefined();
    expect(context.document.getNode(UtilityDirective.NON_NULL)).toBeUndefined();
    expect(context.document.getNode("NonNullOptionsInput")).toBeUndefined();
  });
});
