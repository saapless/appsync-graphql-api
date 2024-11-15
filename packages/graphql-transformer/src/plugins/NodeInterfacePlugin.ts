import { TransformerContext } from "../context";
import {
  DefinitionNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  ObjectNode,
  TypeNode,
} from "../parser";
import { InvalidDefinitionError } from "../utils/errors";
import { ITransformerPlugin } from "./TransformerPluginBase";

export class NodeInterfacePlugin implements ITransformerPlugin {
  name = "NodeInterfacePlugin";
  constructor() {}

  /**
   * Make sure the document contains necessary types:
   * * `Node` interface
   * * `Query` field `node(id: ID!): Node`;
   * @throws {InvalidDefinitionError}
   * When document contains a type named `Node` that is not of proper type (interface)
   */

  public before(context: TransformerContext) {
    const node = context.document.getNode("Node");

    // Node interface is defiend by user;
    if (node) {
      if (!(node instanceof InterfaceNode)) {
        throw new InvalidDefinitionError("Node type must be an interface");
      }

      // Ensure minimum required fields are present
      if (!node.hasField("id")) {
        node.addField(FieldNode.create("id", TypeNode.create("ID", false)));
      }
    } else {
      context.document.addNode(
        InterfaceNode.create("Node", [FieldNode.create("id", TypeNode.create("ID", false))])
      );
    }

    // Ensure Query.node field is defined
    let queryNode = context.document.getNode("Query") as ObjectNode;

    if (!queryNode) {
      queryNode = ObjectNode.create("Query");
      context.document.addNode(queryNode);
    }

    if (!queryNode.hasField("node")) {
      queryNode.addField(
        FieldNode.create("node", TypeNode.create("Node"), [
          InputValueNode.create("id", TypeNode.create("ID", false)),
        ])
      );
    }
  }

  match(definition: DefinitionNode): boolean {
    if (definition instanceof ObjectNode) {
      if (definition.hasInterface("Node") || definition.hasDirective("model")) {
        return true;
      }
    }

    return false;
  }

  execute(context: TransformerContext, definition: DefinitionNode): void {
    if (!(definition instanceof ObjectNode)) {
      return;
    }
  }
}
