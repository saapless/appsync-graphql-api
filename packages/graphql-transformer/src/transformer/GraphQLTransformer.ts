import { writeFileSync } from "node:fs";
import path from "node:path";
import { TransformerContext } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { DocumentNode } from "../parser";
import { SchemaValidationError } from "../utils/errors";

export interface GraphQLTransformerOptions {
  definition: string;
  plugins: IPluginFactory[];

  mode: "development" | "production";
  // Absolute path for dev outputs
  outputDirectory: string;
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

    // Build resolvers

    // for (const [name, resolver] of this.context.resolvers.entries()) {
    //   if (resolver instanceof FunctionResolver) {
    //     output.pipelineFunctions[`${name}`] = resolver.serialize();
    //   }

    //   if (resolver instanceof FieldResolver) {
    //     output.fieldResolvers[`${name}`] = resolver.serialize();
    //   }
    // }

    return output;
  }

  /**
   * Node transformation happens in 3 stages:
   * 1. Normalize - check for necessary fields and arguments on the schema & updates directives;
   * 2. Execute - Adds additional nodes and necessary resources & creates resolvers;
   * 3. Cleanup - Removes internal directives from the schema.
   */

  public transform() {
    const errors = this.document.validate();

    if (errors.length) {
      throw new SchemaValidationError(errors);
    }

    // Stage 1. Normalize
    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.normalize(definition);
        }
      }
    }

    // Stage 2. Execute
    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.execute(definition);
        }
      }
    }

    // Print source schema and resolvers.
    if (this.options.mode === "development") {
      const { outputDirectory } = this.options;

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      writeFileSync(path.resolve(outputDirectory, "schema.graphql"), this.document.print(), {
        encoding: "utf-8",
      });

      for (const [name, resolver] of this.context.resolvers.entries()) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        writeFileSync(path.resolve(outputDirectory, `${name}.ts`), resolver.print(), {
          encoding: "utf-8",
        });
      }
    }

    // Stage 3. Cleanup
    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.cleanup(definition);
        }
      }
    }

    // Generate output
    return this._generateOutput();
  }
}
