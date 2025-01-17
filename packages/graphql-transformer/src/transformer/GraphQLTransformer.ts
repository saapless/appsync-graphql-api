import { writeFileSync } from "node:fs";
import path from "node:path";
import prettier from "@prettier/sync";
import { TransformerContext } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { DocumentNode } from "../parser";
import { SchemaValidationError } from "../utils/errors";
import { ensureOutputDirectory } from "../utils/output";
import { TypeGenerator } from "../codegen";
import { ResolverGenerator } from "../resolver/ResolverGenerator";

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

  private _generateResources() {
    // Print source schema and resolvers.
    const { outputDirectory } = this.options;

    const outputPath = ensureOutputDirectory(outputDirectory);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(path.resolve(outputPath, "schema.graphql"), this.document.print(), {
      encoding: "utf-8",
    });

    const typesGen = new TypeGenerator(this.context.document);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(
      path.resolve(outputPath, "schema-types.d.ts"),
      prettier.format(typesGen.generate(), { parser: "typescript" }),
      {
        encoding: "utf-8",
      }
    );

    const resolverGenerator = new ResolverGenerator(this.context);
    const resolversDir = ensureOutputDirectory(path.join(outputDirectory, "resolvers"));

    resolverGenerator.generate();

    for (const [name, resolver] of this.context.resolvers.entries()) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      writeFileSync(
        path.resolve(resolversDir, `${name}.ts`),
        prettier.format(resolver.print(), { parser: "typescript" }),
        {
          encoding: "utf-8",
        }
      );
    }
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
   * 1. Execute - Adds additional nodes and necessary resources & creates resolvers;
   * 2. Cleanup - Removes internal directives from the schema.
   */

  public transform() {
    const errors = this.document.validate();

    if (errors.length) {
      throw new SchemaValidationError(errors);
    }

    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.normalize(definition);
        }
      }
    }

    for (const definition of this.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.execute(definition);
        }
      }
    }

    this._generateResources();

    // Stage 2. Cleanup
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
