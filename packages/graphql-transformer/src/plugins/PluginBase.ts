import { TransformerContext } from "../context";
import { DefinitionNode } from "../definition";
import { TransformerOutput } from "../transformer";

export interface IPluginFactory {
  create(context: TransformerContext): TransformerPluginBase;
}

export abstract class PluginBase {
  public readonly name: string;
  protected readonly context: TransformerContext;
  constructor(name: string, context: TransformerContext) {
    this.name = name;
    this.context = context;
  }

  static create: (context: TransformerContext) => PluginBase;
}

export abstract class TransformerPluginBase extends PluginBase {
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
   * Normalize the definition node
   */
  public normalize?(definition: DefinitionNode): void;

  /**
   * Execute transformation on the definition node
   */
  public abstract execute(definition: DefinitionNode): void;

  /**
   * Clean up definition
   */
  public cleanup?(definition: DefinitionNode): void;

  /**
   * Generates resources based on the transformation
   */
  public generate?(): void;

  /**
   * Adds any additional resources to output;
   */
  public output?(output: TransformerOutput): void;
}
