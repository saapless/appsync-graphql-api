import { writeFileSync } from "node:fs";
import path from "node:path";
import prettier from "@prettier/sync";
import { buildSync } from "esbuild";
import { TransformerContext } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { DocumentNode } from "../parser";
import { SchemaValidationError } from "../utils/errors";
import { ensureOutputDirectory } from "../utils/output";
import { TypesGenerator } from "../generators";
import { FieldResolver, FunctionResolver, ResolverBase } from "../resolver";
import { TransformerContextConfig } from "../context/TransformerContext";

export interface GraphQLTransformerOptions extends Omit<TransformerContextConfig, "document"> {
  definition: string;
  plugins: IPluginFactory[];
  // Absolute path for dev outputs
  outDir: string;
  mode: "development" | "production";
}

export type FieldResolverOutput = {
  typeName: string;
  fieldName: string;
  pipelineFunctions?: string[];
  dataSource?: string;
  code: string;
};

export type PipelineFunctionOutput = {
  name: string;
  dataSource?: string;
  code: string;
};

export type TransformerOutput = {
  schema: string;
  fieldResolvers: FieldResolverOutput[];
  pipelineFunctions: PipelineFunctionOutput[];
};

export class GraphQLTransformer {
  private readonly _mode: "development" | "production";
  private readonly _outDir: string;

  readonly plugins: TransformerPluginBase[];
  readonly context: TransformerContext;

  constructor(options: GraphQLTransformerOptions) {
    const { definition, outDir, plugins, mode, ...contextOptions } = options;
    this._mode = mode;
    this._outDir = outDir;
    this.context = new TransformerContext({
      document: DocumentNode.fromSource(definition),
      ...contextOptions,
    });
    this.plugins = this._initPlugins(plugins, this.context);
  }

  private _initPlugins(plugins: IPluginFactory[], context: TransformerContext) {
    return plugins.map((factory) => factory.create(context));
  }

  private _printSchemaTypes() {
    const outputPath = ensureOutputDirectory(this._outDir);
    const typesGen = new TypesGenerator(this.context.document);

    writeFileSync(
      path.resolve(outputPath, "schema-types.ts"),
      prettier.format(typesGen.generate(), { parser: "typescript" }),
      {
        encoding: "utf-8",
      }
    );
  }

  private _printSchema(outDir: string) {
    writeFileSync(path.resolve(outDir, "schema.graphql"), this.context.document.print(), {
      encoding: "utf-8",
    });
  }

  private _printResolvers(outDir: string) {
    const basePath = ensureOutputDirectory(path.join(outDir, "resolvers"));
    this.context.resolvers.generate();

    for (const resolver of this.context.resolvers.getAllFieldResolvers()) {
      if (!resolver.isReadonly) {
        const filename = `${resolver.typeName}.${resolver.fieldName}.ts`;

        writeFileSync(
          path.resolve(basePath, filename),
          prettier.format(resolver.print(), { parser: "typescript" }),
          { encoding: "utf-8" }
        );

        resolver.setSource(path.resolve(basePath, filename));
      }
    }

    for (const pipelineFunction of this.context.resolvers.getAllPipelineFunctions()) {
      if (!pipelineFunction.isReadonly) {
        const filename = `${pipelineFunction.name}.ts`;

        writeFileSync(
          path.resolve(basePath, filename),
          prettier.format(pipelineFunction.print(), { parser: "typescript" }),
          { encoding: "utf-8" }
        );

        pipelineFunction.setSource(path.resolve(basePath, filename));
      }
    }
  }

  private _buildResolvers() {
    const fieldResolvers: FieldResolverOutput[] = [];
    const pipelineFunctions: PipelineFunctionOutput[] = [];

    const resolversBySource = new Map<string, ResolverBase[]>();

    for (const resolver of this.context.resolvers.getAllFieldResolvers()) {
      if (resolver.source) {
        if (!resolversBySource.has(resolver.source)) {
          resolversBySource.set(resolver.source, []);
        }

        resolversBySource.get(resolver.source)?.push(resolver);
      }
    }

    for (const pipelineFunction of this.context.resolvers.getAllPipelineFunctions()) {
      if (pipelineFunction.source) {
        if (!resolversBySource.has(pipelineFunction.source)) {
          resolversBySource.set(pipelineFunction.source, []);
        }

        resolversBySource.get(pipelineFunction.source)?.push(pipelineFunction);
      }
    }

    const buildPaths = Array.from(resolversBySource.keys());

    const build = buildSync({
      entryPoints: buildPaths,
      outdir: this._outDir,
      target: "esnext",
      sourcemap: "inline",
      sourcesContent: false,
      treeShaking: true,
      platform: "node",
      format: "esm",
      minify: false,
      bundle: true,
      write: false,
      external: ["@aws-appsync/utils"],
    });

    if (build.errors.length) {
      build.errors.forEach((error) => {
        console.error(error);
      });
    }

    for (const [index, sourcePath] of buildPaths.entries()) {
      const resolverForPath = resolversBySource.get(sourcePath);
      const file = build.outputFiles[Number(index)];

      if (resolverForPath) {
        for (const resolver of resolverForPath) {
          if (resolver instanceof FunctionResolver) {
            pipelineFunctions.push({
              name: resolver.name,
              dataSource: resolver.dataSource,
              code: file.text,
            });
          }

          if (resolver instanceof FieldResolver) {
            fieldResolvers.push({
              typeName: resolver.typeName,
              fieldName: resolver.fieldName,
              pipelineFunctions: resolver.pipelineFunctions,
              dataSource: resolver.dataSource,
              code: file.text,
            });
          }
        }
      }
    }

    return { fieldResolvers, pipelineFunctions };
  }

  private _generateResources() {
    this._printSchema(this._outDir);
    this._printResolvers(this._outDir);
  }

  public transform(): TransformerOutput {
    for (const plugin of this.plugins) {
      plugin.before();
    }

    const errors = this.context.document.validate();

    if (errors.length) {
      throw new SchemaValidationError(errors);
    }

    /**
     * Plugins execute in 3 stages to handle interdependencies.
     * Example: ModelPlugin needs connection keys, while ConnectionPlugin needs Query fields.
     */

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
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
     * with internal, processing only types that can confused the user.
     *
     * After this we generate the types with hints from directives, then we cleanup
     * the declared schema.
     * */

    for (const plugin of this.plugins) {
      plugin.after();
    }

    this._printSchemaTypes();

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.cleanup(definition);
        }
      }
    }

    this._generateResources();

    const { fieldResolvers, pipelineFunctions } = this._buildResolvers();

    return {
      schema: this.context.document.print(),
      fieldResolvers,
      pipelineFunctions,
    };
  }
}
