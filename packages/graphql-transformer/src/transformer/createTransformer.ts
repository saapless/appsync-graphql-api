import {
  AWSTypesPlugin,
  NodeInterfacePlugin,
  ModelPlugin,
  ConnectionPlugin,
  DataLoaderPlugin,
  IPluginFactory,
} from "../plugins";
import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  const { definition, dataSourceConfig, defaultDataSourceName, ...rest } = options;

  if (!definition) {
    throw new Error("Definition is required");
  }

  if (!dataSourceConfig || !defaultDataSourceName) {
    throw new Error("`dataSourceConfig` and `defaultDataSourceName` are required");
  }

  const plugins: IPluginFactory[] = [
    AWSTypesPlugin,
    NodeInterfacePlugin,
    ModelPlugin,
    ConnectionPlugin,
    DataLoaderPlugin,
  ];

  return new GraphQLTransformer({
    definition: definition,
    dataSourceConfig: dataSourceConfig,
    defaultDataSourceName: defaultDataSourceName,
    plugins: plugins,
    mode: options.mode ?? "production",
    outDir: options.outDir ?? "out",
    ...rest,
  });
}
