import { DocumentNode } from "../definition";
import { TransformerContext, TransformerContextConfig } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { SchemaValidationError } from "../utils/errors";
import { ensureOutputDirectory } from "../utils/output";
import { GeneratorPluginBase, IGeneratorFactory } from "../generators/GeneratorBase";

export interface GraphQLTransformerOptions extends Omit<TransformerContextConfig, "document"> {
  definition: string;
  plugins: IPluginFactory[];
  generators: IGeneratorFactory[];
  // Absolute path for dev outputs
  outDir: string;
  mode: "development" | "production";
}

export type TransformerOutput<T extends Record<string, unknown> = Record<string, unknown>> = {
  schema: string;
} & T;

export class GraphQLTransformer<TOutput extends Record<string, unknown> = Record<string, unknown>> {
  private readonly _mode: "development" | "production";
  private readonly _outDir: string;

  readonly context: TransformerContext;
  readonly plugins: TransformerPluginBase[];
  readonly generators: GeneratorPluginBase[];

  constructor(options: GraphQLTransformerOptions) {
    const { definition, outDir, plugins, generators, mode, ...contextOptions } = options;

    this._mode = mode;
    this._outDir = outDir;
    this.context = new TransformerContext({
      document: DocumentNode.fromSource(definition),
      ...contextOptions,
    });

    this.plugins = this._initPlugins(plugins, this.context);
    this.generators = this._initGenerators(generators, this.context);
  }

  private _initPlugins(plugins: IPluginFactory[], context: TransformerContext) {
    return plugins.map((factory) => factory.create(context));
  }

  private _initGenerators(generators: IGeneratorFactory[], context: TransformerContext) {
    return generators.map((factory) => factory.create(context));
  }

  public transform(): TransformerOutput<TOutput> {
    for (const plugin of this.plugins) {
      plugin.before();
    }

    const errors = this.context.document.validate();

    if (errors.length) {
      throw new SchemaValidationError(errors);
    }

    /**
     * Transformations run in 2 stages (`normalize` & `execute`) to handle interdependencies.
     * Example: ModelPlugin needs connection keys, while ConnectionPlugin needs Query fields.
     */

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition) && typeof plugin.normalize === "function") {
          plugin.normalize(definition);
        }
      }
    }

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.execute(definition);
        }
      }
    }

    /**
     * We clean up internal declaration first because we don't want to polute the schema types
     * with internal, processing only types that can confuse users.
     */

    for (const plugin of this.plugins) {
      plugin.after();
    }

    const outputPath = ensureOutputDirectory(this._outDir);

    /**
     * This stage is for generators that need access to the full transformed schema.
     * For example, resolver generators, or backend schema types generators.
     */

    for (const generator of this.generators) {
      if (typeof generator.beforeCleanup === "function") {
        generator.beforeCleanup(outputPath);
      }
    }

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition) && typeof plugin.cleanup === "function") {
          plugin.cleanup(definition);
        }
      }
    }

    for (const generator of this.generators) {
      if (typeof generator.generate === "function") {
        generator.generate(outputPath);
      }
    }

    const output = {
      schema: this.context.document.print(),
    };

    for (const generator of this.generators) {
      if (typeof generator.generateOutput === "function") {
        generator.generateOutput(output);
      }
    }

    return output as TransformerOutput<TOutput>;
  }
}
