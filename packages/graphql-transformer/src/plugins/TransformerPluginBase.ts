import { TransformerContext } from "../context";
import { DefinitionNode } from "../parser";

export interface ITransformerPlugin {
  name: string;
  /**
   * should before transformation, usually adds extra definitions to schema.
   */
  before?: (context: TransformerContext) => void;
  /**
   * Should run after transformation and before validation for cleaup purposes.
   */
  after?: (context: TransformerContext) => void;
  /**
   * Match the definition node to the plugin.
   */
  match(definition: DefinitionNode): boolean;
  /**
   * Execute transformation on the definition node
   */
  execute(context: TransformerContext, definition: DefinitionNode): void;
}
