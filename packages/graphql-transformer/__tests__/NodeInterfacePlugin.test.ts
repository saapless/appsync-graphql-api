import { TransformerContext } from "../src/context";
import { DocumentNode, InterfaceNode, ObjectNode } from "../src/parser";
import { NodeInterfacePlugin } from "../src/plugins/NodeInterfacePlugin";
import { InvalidDefinitionError } from "../src/utils/errors";

describe("NodeInterfacePlugin", () => {
  describe("the `before` hook", () => {
    describe("when user declares invalid `Node` type", () => {
      const schema = /* GraphQL */ `
        type Node {
          id: ID!
        }
      `;
      const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
      const plugin = new NodeInterfacePlugin(context);
      it("it throws InvalidDefinitionError", () => {
        expect(() => plugin.before()).toThrow(InvalidDefinitionError);
      });
    });

    const schema = /* GraphQL */ `
      type User implements Node {
        id: ID!
      }
    `;

    const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
    const plugin = new NodeInterfacePlugin(context);
    plugin.before();

    it("added interface definition", () => {
      const nodeInterface = context.document.getNode("Node") as InterfaceNode;

      expect(nodeInterface).toBeInstanceOf(InterfaceNode);
      expect(nodeInterface.hasField("id")).toBeTruthy();
    });

    it("added `Query.node` field", () => {
      const queryNode = context.document.getNode("Query") as ObjectNode;
      expect(queryNode).toBeInstanceOf(ObjectNode);
      expect(queryNode.hasField("node")).toBeTruthy();
    });
  });
});
