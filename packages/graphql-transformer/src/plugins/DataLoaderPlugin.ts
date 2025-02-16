import { TransformerContext } from "../context";
import {
  DefinitionNode,
  DirectiveDefinitionNode,
  FieldNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  ObjectNode,
} from "../parser";
import { FieldResolver } from "../resolver";
import { TransformPluginExecutionError } from "../utils/errors";
import { TransformerPluginBase } from "./TransformerPluginBase";

type ResesolverDirectiveArgs = {
  name: string;
  dataSource?: string;
  pipeline?: string[];
};

export class DataLoaderPlugin extends TransformerPluginBase {
  public readonly name = "DataLoaderPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document
      .addNode(
        DirectiveDefinitionNode.create("dataSource", "OBJECT", [
          InputValueNode.create("name", NonNullTypeNode.create("String")),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create("resolver", "FIELD_DEFINITION", [
          InputValueNode.create("name", NonNullTypeNode.create("String")),
          InputValueNode.create("dataSource", NamedTypeNode.create("String")),
          InputValueNode.create("pipeline", ListTypeNode.create("String")),
        ])
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      return definition.fields?.some((field) => field.hasDirective("resolver")) ?? false;
    }

    return false;
  }

  private _setFieldResolver(node: ObjectNode | InterfaceNode, field: FieldNode) {
    const args = field.getDirective("resolver")?.getArgumentsJSON<ResesolverDirectiveArgs>();

    if (!args?.name) {
      throw new TransformPluginExecutionError(
        "DataLoaderPlugin",
        `Could not get resolver directive args. Type: ${node.name}, field: ${field.name}`
      );
    }

    const currentResolver = this.context.resolvers.getCustomResolver(args.name);

    if (!currentResolver) {
      throw new TransformPluginExecutionError(
        "DataLoaderPlugin",
        `Could not find resolver with name ${args.name}`
      );
    }

    const returnType = this.context.document.getNode(field.type.getTypeName());

    let dataSource = args.dataSource;

    if (returnType instanceof ObjectNode || returnType instanceof InterfaceNode) {
      const directive = returnType.getDirective("dataSource");

      if (directive) {
        dataSource = directive.getArgumentsJSON<{ name: string }>().name;
      }
    }

    this.context.resolvers.setFieldResolver(
      FieldResolver.fromSource(
        node.name,
        field.name,
        currentResolver.source!,
        dataSource ?? this.context.defaultDataSourceName,
        args.pipeline
      )
    );
  }

  public execute(definition: ObjectNode | InterfaceNode) {
    if (definition.fields) {
      for (const field of definition.fields) {
        if (field.hasDirective("resolver")) {
          this._setFieldResolver(definition, field);
        }
      }
    }
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    definition.removeDirective("dataSource");

    for (const field of definition.fields ?? []) {
      if (field.hasDirective("resolver")) {
        field.removeDirective("resolver");
      }
    }
  }

  public after(): void {
    this.context.document.removeNode("dataSource").removeNode("resolver");
  }

  static create(context: TransformerContext) {
    return new DataLoaderPlugin(context);
  }
}
