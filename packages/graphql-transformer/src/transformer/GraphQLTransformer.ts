import { DocumentNode } from "../definition";
import { TransformerContext, TransformerContextConfig } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { SchemaValidationError } from "../utils/errors";

export interface GraphQLTransformerOptions
  extends Omit<TransformerContextConfig, "document" | "outputDirectory"> {
  definition: string;
  plugins: IPluginFactory[];
  // Absolute path for dev outputs
  outDir: string;
  mode: "development" | "production";
}

export type TransformerOutput<T extends Record<string, unknown> = Record<string, unknown>> = {
  schema: string;
} & T;

export class GraphQLTransformer<TOutput extends Record<string, unknown> = Record<string, unknown>> {
  readonly context: TransformerContext;
  readonly plugins: TransformerPluginBase[];

  constructor(options: GraphQLTransformerOptions) {
    const { definition, outDir, plugins, ...contextOptions } = options;

    this.context = new TransformerContext({
      document: DocumentNode.fromSource(definition),
      outputDirectory: outDir,
      ...contextOptions,
    });

    this.plugins = this._initPlugins(plugins, this.context);
  }

  private _initPlugins(plugins: IPluginFactory[], context: TransformerContext) {
    return plugins.map((factory) => factory.create(context));
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
     * with internals (processing only types that can confuse users).
     * TODO: mark internal types with `@internal` directive to avoid confusion.
     */

    for (const plugin of this.plugins) {
      plugin.after();
    }

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition) && typeof plugin.cleanup === "function") {
          plugin.cleanup(definition);
        }
      }
    }

    for (const generator of this.plugins) {
      if (typeof generator.generate === "function") {
        generator.generate();
      }
    }

    const output = {
      schema: this.context.document.print(),
    };

    for (const generator of this.plugins) {
      if (typeof generator.output === "function") {
        generator.output(output);
      }
    }

    return output as TransformerOutput<TOutput>;
  }
}
