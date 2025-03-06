import { TransformerContext } from "../context";
import {
  ArgumentNode,
  DefinitionNode,
  DirectiveNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
  ValueNode,
} from "../definition";
import { InvalidDefinitionError, TransformPluginExecutionError } from "../utils/errors";
import { TransformerPluginBase } from "./PluginBase";

export class NodeInterfacePlugin extends TransformerPluginBase {
  constructor(context: TransformerContext) {
    super("NodeInterfacePlugin", context);
  }

  /**
   * Make sure context contains necessary resources & types:
   * * `Node` interface
   * * `Query` field `node(id: ID!): Node`;
   * * `Query.node` resolver
   * @throws {InvalidDefinitionError}
   * If document declares `Node` but is not an `interface`
   */

  public before(): void {
    let node = this.context.document.getNode("Node");

    // Node interface is defiend by user;
    if (node) {
      if (!(node instanceof InterfaceNode)) {
        throw new InvalidDefinitionError("Node type must be an interface");
      }
    } else {
      node = InterfaceNode.create("Node", []);
      this.context.document.addNode(node);
    }

    // Ensure minimum required fields are present
    if (!node.hasField("id")) {
      node.addField(FieldNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))));
    }

    if (!node.hasField("createdAt")) {
      node.addField(FieldNode.create("createdAt", NamedTypeNode.create("String")));
    }

    if (!node.hasField("updatedAt")) {
      node.addField(FieldNode.create("updatedAt", NamedTypeNode.create("String")));
    }

    // TODO: Enable with versioning;
    // if (!node.hasField("_version")) {
    //   node.addField(FieldNode.create("_version", NamedTypeNode.create("Int")));
    // }

    // if (!node.hasField("_deleted")) {
    //   node.addField(
    //     FieldNode.create("_deleted", NamedTypeNode.create("Boolean"), null, [
    //       DirectiveNode.create("readOnly"),
    //     ])
    //   );
    // }

    if (!node.hasField("__typename")) {
      node.addField(
        FieldNode.create("__typename", NonNullTypeNode.create("String"), null, [
          DirectiveNode.create("serverOnly"),
        ])
      );
    }

    // TODO Handle this in DynamoDB resolvers only.
    // if (!node.hasField("_sk")) {
    //   node.addField(
    //     FieldNode.create("_sk", NonNullTypeNode.create("String"), null, [
    //       DirectiveNode.create("serverOnly"),
    //     ])
    //   );
    // }

    // Ensure Query.node field is defined
    const queryNode = this.context.document.getQueryNode();

    if (!queryNode.hasField("node")) {
      queryNode.addField(
        FieldNode.create(
          "node",
          NamedTypeNode.create("Node"),
          [InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID")))],
          [
            DirectiveNode.create("hasOne", [
              ArgumentNode.create("key", ValueNode.fromValue({ ref: "args.id" })),
            ]),
          ]
        )
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

  execute(definition: ObjectNode): void {
    const nodeInterface = this.context.document.getNode("Node") as InterfaceNode;

    if (!nodeInterface) {
      throw new TransformPluginExecutionError(
        this.name,
        "Node Interface not found. Make sure you run `plugin.before()` before executing."
      );
    }

    // In definition has directive `@model` it should also implement `Node` interface
    if (definition.hasDirective("model")) {
      definition.addInterface(nodeInterface.name);
    }

    // Make sure that all fields declared by `Node` interface are declared by definition as well
    const nodeFields = nodeInterface.fields ?? [];

    for (const field of nodeFields) {
      if (!definition.hasField(field.name)) {
        definition.addField(FieldNode.fromDefinition(field.serialize()));
      } else {
        // TODO: Check if field types match
        // This might throw an error in the validation process
        // so could be redundant, will investigate.
      }
    }
  }

  public after(): void {
    const iface = this.context.document.getNode("Node");

    if (!iface || !(iface instanceof InterfaceNode)) {
      throw new TransformPluginExecutionError(
        this.name,
        "Node Interface not found. Make sure you run `plugin.before()` before executing."
      );
    }

    // Node interface should have only 1 field, the `id`
    for (const field of iface.fields ?? []) {
      if (field.name !== "id") {
        iface.removeField(field.name);
      }
    }
  }

  static create(context: TransformerContext): NodeInterfacePlugin {
    return new NodeInterfacePlugin(context);
  }
}
