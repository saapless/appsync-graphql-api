import {
  type IPluginFactory,
  NodeInterfacePlugin,
  UtilitiesPlugin,
  ModelPlugin,
  ConnectionPlugin,
  AuthPlugin,
  SchemaGenerator,
  SchemaTypesGenerator,
} from "../plugins";
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
    AuthPlugin,
    SchemaGenerator,
    SchemaTypesGenerator,
    ...plugins,
  ];

  return new GraphQLTransformer({
    definition: definition,
    plugins: mergedPlugins,
    mode: options.mode ?? "production",
    outDir: outDir ?? "__generated__",
    ...rest,
  });
}
