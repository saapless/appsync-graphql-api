import { NodeInterfacePlugin } from "../plugins";
import { AWSTypesPlugin } from "../plugins/AWSTypesPlugin";
import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: Partial<GraphQLTransformerOptions>) {
  if (!options.definition) {
    throw new Error("Definition is required");
  }

  if (!options.plugins) {
    options.plugins = [AWSTypesPlugin, NodeInterfacePlugin];
  }

  return new GraphQLTransformer({
    definition: options.definition,
    plugins: options.plugins,
  });
}
