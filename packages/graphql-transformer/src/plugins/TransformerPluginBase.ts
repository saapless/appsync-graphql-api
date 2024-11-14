import { TypeDefinitionNode } from "graphql";

export abstract class TransformerPluginBase {
  public abstract match(definition: TypeDefinitionNode): boolean;
  public abstract execute(context: unknown, definition: TypeDefinitionNode): void;
}
