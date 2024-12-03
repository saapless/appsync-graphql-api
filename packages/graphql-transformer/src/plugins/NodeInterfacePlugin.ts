import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../parser";
import { FieldResolver, tc } from "../resolver";
import { InvalidDefinitionError, TransformPluginExecutionError } from "../utils/errors";
import { TransformerPluginBase } from "./TransformerPluginBase";

export class NodeInterfacePlugin extends TransformerPluginBase {
  readonly name = "NodeInterfacePlugin";

  constructor(context: TransformerContext) {
    super(context);
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
      node.addField(FieldNode.create("createdAt", NamedTypeNode.create("AWSDateTime")));
    }

    if (!node.hasField("updatedAt")) {
      node.addField(FieldNode.create("updatedAt", NamedTypeNode.create("AWSDateTime")));
    }

    if (!node.hasField("_version")) {
      node.addField(FieldNode.create("_version", NamedTypeNode.create("Int")));
    }

    if (!node.hasField("_deleted")) {
      node.addField(
        FieldNode.create("_deleted", NamedTypeNode.create("Boolean")).addDirective(
          DirectiveNode.create("readonly")
        )
      );
    }

    // Ensure Query.node field is defined
    const queryNode = this.context.document.getQueryNode();

    if (!queryNode.hasField("node")) {
      queryNode.addField(
        FieldNode.create("node", NamedTypeNode.create("Node"), [
          InputValueNode.create("id", NonNullTypeNode.create(NamedTypeNode.create("ID"))),
        ])
      );
    }

    // Add Query.node resolver
    // TODO: Maybe move this in the `after` hook. Need to decide how will implement auth rules

    const field = queryNode.getField("node") as FieldNode;

    if (!field.hasDirective("resolver")) {
      const resolver = FieldResolver.create("Query", "node");
      resolver
        .addImport("@aws-appsync/utils", "util")
        .addImport("@aws-appsync/utils/dynamodb", "get")
        .setStage(
          "LOAD",
          tc.return(
            tc.call(tc.ref("get"), [
              tc.obj(tc.prop("key", tc.obj(tc.prop("id", tc.chain("ctx.args.id"))))),
            ])
          )
        )
        .setStage("RETURN", tc.return(tc.ref("ctx.result")));

      this.context.resolvers.set("Query.node", resolver);
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

  static create(context: TransformerContext): NodeInterfacePlugin {
    return new NodeInterfacePlugin(context);
  }
}
