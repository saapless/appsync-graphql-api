import {
  type IPluginFactory,
  NodeInterfacePlugin,
  UtilitiesPlugin,
  ModelPlugin,
  ConnectionPlugin,
} from "../plugins";
import { type IGeneratorFactory, SchemaGenerator, SchemaTypesGenerator } from "../generators";
import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  const { definition, plugins = [], generators = [], ...rest } = options;

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

  const mergedGenerators: IGeneratorFactory[] = [
    SchemaGenerator,
    SchemaTypesGenerator,
    ...generators,
  ];

  return new GraphQLTransformer({
    definition: definition,
    plugins: mergedPlugins,
    generators: mergedGenerators,
    mode: options.mode ?? "production",
    outDir: options.outDir ?? "__generated__",
    ...rest,
  });
}
