import { TransformerContext } from "../context";
import { DefinitionNode } from "../parser";

export interface IPluginFactory {
  create(context: TransformerContext): TransformerPluginBase;
}

export abstract class TransformerPluginBase {
  public abstract readonly name: string;
  public readonly context: TransformerContext;
  constructor(context: TransformerContext) {
    this.context = context;
  }

  /**
   * should run before transformation, usually adds extra definitions to schema.
   */
  public before() {}
  /**
   * Should run after transformation and before validation for cleaup purposes.
   */
  public after() {}
  /**
   * Match the definition node to the plugin.
   */
  public abstract match(definition: DefinitionNode): boolean;
  /**
   * Execute transformation on the definition node
   */
  public abstract execute(definition: DefinitionNode): void;

  static create: (context: TransformerContext) => TransformerPluginBase;
}
