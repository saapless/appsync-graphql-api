import path from "node:path";
import { DocumentNode } from "../definition";
import { TransformerContext, TransformerContextConfig } from "../context";
import { SchemaTypesGenerator, ResolverTypesGenerator } from "../generators";
import { IPluginFactory, TransformerPluginBase } from "../plugins";
import { FieldResolver, FunctionResolver, ResolverBase } from "../resolver";
import { SchemaValidationError } from "../utils/errors";
import { buildPaths, ensureOutputDirectory, prettyPrintFile, printFile } from "../utils/output";

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
  dataSource: string;
  code: string;
};

export type PipelineFunctionOutput = {
  name: string;
  dataSource: string;
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

  private _printSchemaTypes(outDir: string) {
    const typesGen = new SchemaTypesGenerator(this.context);
    prettyPrintFile(path.resolve(outDir, "schema-types.ts"), typesGen.generate("schema-types.ts"));
  }

  private _printResolverTypes(outDir: string) {
    const typesGen = new ResolverTypesGenerator(this.context);
    prettyPrintFile(
      path.resolve(outDir, "resolver-types.ts"),
      typesGen.generate("resolver-types.ts")
    );
  }

  private _printSchema(outDir: string) {
    printFile(path.resolve(outDir, "schema.graphql"), this.context.document.print());
  }

  private _printResolvers(outDir: string) {
    const basePath = ensureOutputDirectory(path.join(outDir, "resolvers"));
    this.context.resolvers.generate();

    for (const resolver of this.context.resolvers.getAllFieldResolvers()) {
      if (!resolver.isReadonly) {
        const filename = `${resolver.typeName}.${resolver.fieldName}.ts`;

        prettyPrintFile(path.resolve(basePath, filename), resolver.print());
        resolver.setSource(path.resolve(basePath, filename));
      }
    }

    for (const pipelineFunction of this.context.resolvers.getAllPipelineFunctions()) {
      if (!pipelineFunction.isReadonly) {
        const filename = `${pipelineFunction.name}.ts`;

        prettyPrintFile(path.resolve(basePath, filename), pipelineFunction.print());
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

    const paths = Array.from(resolversBySource.keys());

    const buildResult = buildPaths(paths, this._outDir);

    if (buildResult.errors.length) {
      buildResult.errors.forEach((error) => {
        console.error(error);
      });
    }

    for (const [index, sourcePath] of paths.entries()) {
      const resolverForPath = resolversBySource.get(sourcePath);
      const file = buildResult.outputFiles[Number(index)];

      if (resolverForPath) {
        for (const resolver of resolverForPath) {
          if (resolver instanceof FunctionResolver) {
            pipelineFunctions.push({
              name: resolver.name,
              dataSource: resolver.dataSource ?? this.context.dataSources.primaryDataSourceName,
              code: file.text,
            });
          }

          if (resolver instanceof FieldResolver) {
            fieldResolvers.push({
              typeName: resolver.typeName,
              fieldName: resolver.fieldName,
              pipelineFunctions: resolver.pipelineFunctions,
              dataSource: resolver.dataSource ?? this.context.dataSources.primaryDataSourceName,
              code: file.text,
            });
          }
        }
      }
    }

    return { fieldResolvers, pipelineFunctions };
  }

  private _generateResources(outDir: string) {
    this._printSchema(outDir);
    this._printResolvers(outDir);
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
     * with internal, processing only types that can confuse users.
     *
     * After this we generate the types with hints from directives, then we cleanup
     * the declared schema.
     * */

    for (const plugin of this.plugins) {
      plugin.after();
    }

    const outputPath = ensureOutputDirectory(this._outDir);

    this._printSchemaTypes(outputPath);
    this._printResolverTypes(outputPath);

    for (const definition of this.context.document.definitions.values()) {
      for (const plugin of this.plugins) {
        if (plugin.match(definition)) {
          plugin.cleanup(definition);
        }
      }
    }

    this._generateResources(outputPath);

    const { fieldResolvers, pipelineFunctions } = this._buildResolvers();

    return {
      schema: this.context.document.print(),
      fieldResolvers,
      pipelineFunctions,
    };
  }
}
