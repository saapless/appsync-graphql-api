import {
  AWSTypesPlugin,
  NodeInterfacePlugin,
  ModelPlugin,
  ConnectionPlugin,
  DataLoaderPlugin,
} from "../plugins";
import { TransformExecutionError } from "../utils/errors";

import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  if (!options.definition) {
    throw new TransformExecutionError("Definition is required");
  }

  if (!options.plugins) {
    options.plugins = [
      AWSTypesPlugin,
      NodeInterfacePlugin,
      ModelPlugin,
      ConnectionPlugin,
      DataLoaderPlugin,
    ];
  }

  return new GraphQLTransformer({
    definition: options.definition,
    plugins: options.plugins,
    mode: options.mode ?? "production",
    outputDirectory: options.outputDirectory ?? "out",
  });
}
