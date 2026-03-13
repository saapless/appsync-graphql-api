import type { IPluginFactory } from "../plugins";
import { TransformerContext } from "../context";
import { DocumentNode } from "../definition";
import { NodeInterfacePlugin, UtilitiesPlugin, ModelPlugin, ConnectionPlugin } from "../plugins";
import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  const { definition, outDir, plugins = [], ...rest } = options;

  if (!definition) {
    throw new Error("Definition is required");
  }

  const mergedPlugins: IPluginFactory[] = [
    UtilitiesPlugin,
    NodeInterfacePlugin,
    ModelPlugin,
    ConnectionPlugin,
    ...plugins,
  ];

  const context = new TransformerContext({
    document: DocumentNode.fromSource(definition),
    outputDirectory: outDir ?? "__generated__",
    ...rest,
  });

  return new GraphQLTransformer(context, mergedPlugins);
}
