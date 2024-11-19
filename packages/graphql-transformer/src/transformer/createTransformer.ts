import {
  AWSTypesPlugin,
  AuthPlugin,
  NodeInterfacePlugin,
  ModelPlugin,
  ConnectionPlugin,
  DataLoaderPlugin,
} from "../plugins";

import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  if (!options.definition) {
    throw new Error("Definition is required");
  }

  if (!options.plugins) {
    options.plugins = [
      AWSTypesPlugin,
      NodeInterfacePlugin,
      AuthPlugin,
      ModelPlugin,
      ConnectionPlugin,
      DataLoaderPlugin,
    ];
  }

  return new GraphQLTransformer({
    definition: options.definition,
    plugins: options.plugins,
  });
}
