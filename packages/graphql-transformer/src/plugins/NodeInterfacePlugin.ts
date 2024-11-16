import { TransformerContext } from "../context";
import {
  DefinitionNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  ObjectNode,
  TypeNode,
} from "../parser";
import { FieldResolver } from "../resolver";
import { block, expression, join, statement } from "../resolver/ast/utils";
import { InvalidDefinitionError } from "../utils/errors";
import { ITransformerPlugin } from "./TransformerPluginBase";

export class NodeInterfacePlugin implements ITransformerPlugin {
  name = "NodeInterfacePlugin";
  constructor() {}

  /**
   * Make sure context contains necessary resources & types:
   * * `Node` interface
   * * `Query` field `node(id: ID!): Node`;
   * * `Query.node` resolver
   * @throws {InvalidDefinitionError}
   * If document declares `Node` but is not an `interface`
   */

  public before(context: TransformerContext): void {
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

    // Add Query.node resolver
    const field = queryNode.getField("node") as FieldNode;

    if (!field.hasDirective("resolver")) {
      const resolver = FieldResolver.create("Query", "node");
      resolver
        .addImport("@aws-appsync/utils", { value: "util" })
        .addImport("@aws-appsync/utils/dynamodb", { value: "get" })
        .addRequestFunction(statement("return get({ key: { id: ctx.args.id } })"))
        .addResponseFunction(
          join(
            "\n",
            statement("const { error, result } = ctx"),
            join(" ", "if", expression("error"), block("util.error(error.message, error.type)")),
            statement("return result")
          )
        );

      context.resolvers.set("Query.node", resolver);
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
