import { TransformerContext } from "../../src/context";
import { DocumentNode, InterfaceNode } from "../../src/parser";
import { NodeInterfacePlugin } from "../../src/plugins/NodeInterfacePlugin";
import { InvalidDefinitionError } from "../../src/utils/errors";

describe("NodeInterfacePlugin", () => {
  const plugin = new NodeInterfacePlugin();

  describe("when running the `before` hook", () => {
    it("should throw if invalid `Node` type", () => {
      const schema = /* GraphQL */ `
        type Node {
          id: ID!
        }
      `;

      const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
      expect(() => plugin.before(context)).toThrow(InvalidDefinitionError);
    });

    it("should add interface definition", () => {
      const schema = /* GraphQL */ `
        type User implements Node {
          id: ID!
        }
      `;

      const context = new TransformerContext({ document: DocumentNode.fromSource(schema) });
      plugin.before(context);
      const nodeInterface = context.document.getNode("Node") as InterfaceNode;

      expect(nodeInterface).toBeInstanceOf(InterfaceNode);
      expect(nodeInterface.hasField("id")).toBeTruthy();
    });
  });
});
