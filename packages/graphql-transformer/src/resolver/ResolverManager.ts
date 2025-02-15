import path from "node:path";
import fs from "node:fs";
import { TransformerContext } from "../context";
import { InterfaceNode, ObjectNode } from "../parser";
import { FieldResolver } from "./FieldResolver";
import { FunctionResolver } from "./FunctionResolver";
import { ResolverBase } from "./ResolverBase";

export type ResolverManagerConfig = {
  readonly customResolverSource?: string;
};

export class ResolverManager {
  private readonly _fieldResolvers: Map<string, FieldResolver> = new Map();
  private readonly _pipelineFunctions: Map<string, FunctionResolver> = new Map();
  private readonly _customResolvers: Map<string, ResolverBase> = new Map();
  private readonly _context: TransformerContext;

  constructor(context: TransformerContext, config?: ResolverManagerConfig) {
    this._context = context;

    if (config?.customResolverSource) {
      this._createCustomResolvers(config.customResolverSource);
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

  private _createCustomResolvers(source: string) {
    let globPath = source;

    if (fs.lstatSync(source).isDirectory()) {
      globPath = path.join(source, "**", "*.{js,ts}");
    }

    const files = fs.globSync(globPath);

    for (const file of files) {
      const name = path.basename(file, path.extname(file));

      if (this._isFieldResolverName(name)) {
        const [typeName, fieldName] = name.split(".");
        const resolver = FieldResolver.fromSource(typeName, fieldName, source);
        this._fieldResolvers.set(name, resolver);
      }

      const resolver = ResolverBase.fromSource(name, source);
      this._customResolvers.set(name, resolver);
    }
  }

  private _getOrCreateFieldResolver(type: string, field: string): FieldResolver {
    const key = `${type}.${field}`;
    let resolver = this._fieldResolvers.get(key);

    if (!resolver) {
      resolver = new FieldResolver(type, field);
      this._fieldResolvers.set(key, resolver);
    }

    return resolver;
  }

  private _getOrCreateFunctionResolver(name: string): FunctionResolver {
    let resolver = this._pipelineFunctions.get(name);

    if (!resolver) {
      resolver = new FunctionResolver(name);
      this._pipelineFunctions.set(name, resolver);
    }

    return resolver;
  }
}
