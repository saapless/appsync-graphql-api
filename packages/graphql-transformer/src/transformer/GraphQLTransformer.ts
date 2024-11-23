import { TransformerContext } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { DocumentNode } from "../parser";
import { SchemaValidationError } from "../utils/errors";
import { FieldResolver, FunctionResolver } from "../resolver";

export interface GraphQLTransformerOptions {
  definition: string;
  plugins: IPluginFactory[];
}

export type TransformerOutput = {
  schema: string;
  fieldResolvers: Record<string, unknown>;
  pipelineFunctions: Record<string, unknown>;
};

export class GraphQLTransformer {
  readonly document: DocumentNode;
  readonly context: TransformerContext;
  readonly plugins: TransformerPluginBase[];

  constructor(protected readonly options: GraphQLTransformerOptions) {
    this.document = DocumentNode.fromSource(options.definition);
    this.context = new TransformerContext({ document: this.document });
    this.plugins = this._initPlugins(this.context);

    for (const plugin of this.plugins) {
      plugin.before();
    }
  }

  private _initPlugins(context: TransformerContext) {
    return this.options.plugins.map((factory) => factory.create(context));
  }

  private _generateOutput() {
    for (const plugin of this.plugins) {
      plugin.after();
    }

    const output: TransformerOutput = {
      schema: this.document.print(),
      fieldResolvers: {},
      pipelineFunctions: {},
    };

    for (const [name, resolver] of this.context.resolvers.entries()) {
      if (resolver instanceof FunctionResolver) {
        output.pipelineFunctions[`${name}`] = resolver.serialize();
      }

      if (resolver instanceof FieldResolver) {
        output.fieldResolvers[`${name}`] = resolver.serialize();
      }
    }

    return output;
  }

  public transform() {
    const errors = this.document.validate();

    if (errors.length) {
      throw new SchemaValidationError(errors);
    }

    // Run transformers
    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.execute(definition);
        }
      }
    }

    // Print source schema and resolvers.
    // Cleaup schema
    // Generate output
    return this._generateOutput();
  }
}
