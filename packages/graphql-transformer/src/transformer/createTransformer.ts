import {
  AWSTypesPlugin,
  AuthPlugin,
  NodeInterfacePlugin,
  ModelPlugin,
  ConnectionPlugin,
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
    ];
  }

  return new GraphQLTransformer({
    definition: options.definition,
    plugins: options.plugins,
  });
}
