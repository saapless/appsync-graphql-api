import path from "node:path";
import fs from "node:fs";
import { TransformerContext } from "../context";
import { InterfaceNode, ObjectNode } from "../definition";
import { LoaderDescriptor } from "../utils/types";
import { FieldResolver } from "./FieldResolver";
import { FunctionResolver } from "./FunctionResolver";
import { ResolverBase } from "./ResolverBase";

export type ResolverManagerConfig = {
  readonly customResolversSource?: string | string[];
};

export class ResolverManager {
  private readonly _fieldResolvers: Map<string, FieldResolver> = new Map();
  private readonly _pipelineFunctions: Map<string, FunctionResolver> = new Map();
  private readonly _customResolvers: Map<string, ResolverBase> = new Map();
  private readonly _context: TransformerContext;

  constructor(context: TransformerContext, config?: ResolverManagerConfig) {
    this._context = context;

    if (config?.customResolversSource) {
      this._createCustomResolvers(config.customResolversSource);
    }
  }

  private _isFieldResolverName(name: string) {
    const [typeName, fieldName] = name.split(".");

    if (!typeName || !fieldName) {
      return false;
    }

    const node = this._context.document.getNode(typeName);
    if (node instanceof ObjectNode || node instanceof InterfaceNode) {
      return node.hasField(fieldName);
    }

    return false;
  }

  private _createCustomResolvers(source: string | string[]) {
    let globPath = source;

    if (!Array.isArray(source) && fs.lstatSync(source).isDirectory()) {
      globPath = path.join(source, "**", "*.{js,ts}");
    }

    const files = fs.globSync(globPath);

    for (const file of files) {
      const name = path.basename(file, path.extname(file));

      if (this._isFieldResolverName(name)) {
        const [typeName, fieldName] = name.split(".");
        const resolver = FieldResolver.fromSource(typeName, fieldName, file);
        this._fieldResolvers.set(name, resolver);
      }

      const resolver = ResolverBase.fromSource(name, file);
      this._customResolvers.set(name, resolver);
    }
  }

  private _getOrCreateFieldResolver(
    type: string,
    field: string,
    dataSource: string,
    pipelineFunctions?: string[]
  ): FieldResolver {
    const key = `${type}.${field}`;
    let resolver = this._fieldResolvers.get(key);

    if (!resolver) {
      resolver = FieldResolver.create(type, field, dataSource, pipelineFunctions);
      this._fieldResolvers.set(key, resolver);
    }

    return resolver;
  }

  private _getOrCreateFunctionResolver(name: string, dataSource: string): FunctionResolver {
    let resolver = this._pipelineFunctions.get(name);

    if (!resolver) {
      resolver = FunctionResolver.create(name, dataSource);
      this._pipelineFunctions.set(name, resolver);
    }

    return resolver;
  }

  public hasFieldResolver(type: string, field: string) {
    return this._fieldResolvers.has(`${type}.${field}`);
  }

  public hasPipelineFunction(name: string) {
    return this._pipelineFunctions.has(name);
  }

  public getFieldResolver(type: string, field: string) {
    return this._fieldResolvers.get(`${type}.${field}`);
  }

  public getPipelineFunction(name: string) {
    return this._pipelineFunctions.get(name);
  }

  public getAllFieldResolvers() {
    return Array.from(this._fieldResolvers.values());
  }

  public getAllPipelineFunctions() {
    return Array.from(this._pipelineFunctions.values());
  }

  public setFieldResolver(resolver: FieldResolver) {
    this._fieldResolvers.set(`${resolver.typeName}.${resolver.fieldName}`, resolver);
    return this;
  }

  public setPipelineFunction(resolver: FunctionResolver) {
    this._pipelineFunctions.set(resolver.name, resolver);
    return this;
  }

  public hasCustomResolver(name: string) {
    return this._customResolvers.has(name);
  }

  public getCustomResolver(name: string) {
    return this._customResolvers.get(name);
  }

  private _generateResolver(resolver: ResolverBase, loader: LoaderDescriptor) {
    if (!resolver.isReadonly) {
      const generator = this._context.dataSources.getDataSourceGenerator(resolver.dataSource!);

      const code = generator.generateTemplate(loader);
      resolver.setCode(code);
    }
  }

  private _generateFieldResolvers() {
    for (const loader of this._context.loader.getAllFieldLoaders()) {
      const dataSourceName = loader.dataSource ?? this._context.dataSources.primaryDataSourceName;

      const resolver = this._getOrCreateFieldResolver(
        loader.typeName,
        loader.fieldName,
        dataSourceName,
        loader.pipeline
      );

      this._generateResolver(resolver, loader);
    }
  }

  private _generatePipelineFunctions() {
    for (const loader of this._context.loader.getAllFunctionLoaders()) {
      const dataSourceName = loader.dataSource ?? this._context.dataSources.primaryDataSourceName;

      const resolver = this._getOrCreateFunctionResolver(loader.name, dataSourceName);
      this._generateResolver(resolver, loader);
    }
  }

  public generate() {
    this._generateFieldResolvers();
    this._generatePipelineFunctions();
  }
}
