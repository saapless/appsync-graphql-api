import {
  AWSTypesPlugin,
  NodeInterfacePlugin,
  ModelPlugin,
  ConnectionPlugin,
  DataLoaderPlugin,
  IPluginFactory,
} from "../plugins";
import { UtilitiesPlugin } from "../plugins/UtilitiesPlugin";
import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  const { definition, dataSourceConfig, ...rest } = options;

  if (!definition) {
    throw new Error("Definition is required");
  }

  if (!dataSourceConfig) {
    throw new Error("`dataSourceConfig` and `defaultDataSourceName` are required");
  }

  const plugins: IPluginFactory[] = [
    AWSTypesPlugin,
    UtilitiesPlugin,
    NodeInterfacePlugin,
    ModelPlugin,
    ConnectionPlugin,
    DataLoaderPlugin,
  ];

  return new GraphQLTransformer({
    definition: definition,
    dataSourceConfig: dataSourceConfig,
    plugins: plugins,
    mode: options.mode ?? "production",
    outDir: options.outDir ?? "out",
    ...rest,
  });
}
