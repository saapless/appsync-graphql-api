import { GraphQLTransformer, GraphQLTransformerOptions } from "./GraphQLTransformer";

export function createTransformer(options: GraphQLTransformerOptions) {
  return new GraphQLTransformer(options);
}
