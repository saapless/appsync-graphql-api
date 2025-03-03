import { TransformerContext } from "../context";
import { buildPaths, ResolverBuildError, TransformPluginExecutionError } from "../utils";
import { TransformerOutput } from "../transformer";
import { FieldResolver, FunctionResolver, ResolverBase } from "../resolver";
import { GeneratorPluginBase } from "./GeneratorBase";

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

export class ResolversGenerator extends GeneratorPluginBase {
  constructor(context: TransformerContext) {
    super("ResolversGenerator", context);
  }

  private _mapResolversBySource() {
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

    return resolversBySource;
  }

  private _buildResolvers(paths: string[]) {
    const buildResult = buildPaths(paths, "__generated__");

    if (buildResult.errors.length) {
      throw new ResolverBuildError(buildResult.errors);
    }

    if (buildResult.warnings.length) {
      console.warn(`${this.name}:\n\n${buildResult.warnings.join("\n")}`);
    }

    return buildResult;
  }

  public generateOutput(output: TransformerOutput) {
    if (Object.hasOwn(output, "fieldResolvers") || Object.hasOwn(output, "pipelineFunctions")) {
      throw new TransformPluginExecutionError(
        this.name,
        "Output contains conflicting keys `fieldResolvers` && `pipelineFunctions`."
      );
    }

    const fieldResolvers: FieldResolverOutput[] = [];
    const pipelineFunctions: PipelineFunctionOutput[] = [];

    const resolversBySource = this._mapResolversBySource();

    const paths = Array.from(resolversBySource.keys());
    const buildResult = this._buildResolvers(paths);

    for (const [index, sourcePath] of paths.entries()) {
      const resolverForPath = resolversBySource.get(sourcePath);
      const file = buildResult.outputFiles[Number(index)];

      if (resolverForPath) {
        for (const resolver of resolverForPath) {
          if (!resolver.dataSource) {
            throw new TransformPluginExecutionError(
              this.name,
              "Resolver does not have a data source defined."
            );
          }

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

    Object.assign(output, { fieldResolvers, pipelineFunctions });
  }

  public generate() {
    for (const loader of this.context.resolvers.getAllLoaders()) {
      const resolver = this.context.resolvers.getOrCreateFieldResolver(
        loader.typeName,
        loader.fieldName,
        loader.dataSource
      );

      if (!resolver.isReadonly) {
        // Generate resolver code here
      }
    }
  }
}
