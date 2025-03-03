import { TransformerContext } from "../context";
import { PluginBase } from "../plugins/PluginBase";
import { TransformerOutput } from "../transformer";

export interface IGeneratorFactory {
  create(context: TransformerContext): GeneratorPluginBase;
}

export abstract class GeneratorPluginBase extends PluginBase {
  constructor(name: string, context: TransformerContext) {
    super(name, context);
  }

  public beforeCleanup?(outDir: string): void;
  public generate?(outDir: string): void;
  public generateOutput?(output: TransformerOutput): void;
}
