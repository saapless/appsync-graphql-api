import type { OutputFile } from "esbuild";

export enum ResolverKind {
  FIELD_RESOLVER = "FieldResolver",
  FUNCTION_RESOLVER = "FunctionResolver",
}

/**
 * In order to allow plugins to handle a different aspect in the execution process of a resolver
 * we heed a way organize and identify the declarations.
 *
 * The execution process is divided into 4 stages:
 * 1. `Initiate` - tipically used in the entrypoint resolver
 *     like `Query.node` or `Mutation.createCode` to setup the context and default values
 * 2. `Authorize` - check request authorization based on context or set up condition rules
 * 3. `Load` - used by all resolver, defines the dataSource request.
 * 4. `Return` - tipically used in the `response` resolver to check and format
 *     the dataSource result.
 */

export class ResolverBase {
  private readonly _name: string;
  public readonly isReadonly: boolean = false;
  public readonly dataSource?: string;
  private _code?: string;
  public source?: string;
  public output?: OutputFile;

  constructor(name: string, dataSource?: string, source?: string, isReadonly = false) {
    this._name = name;
    this.dataSource = dataSource;
    this.source = source;
    this.isReadonly = isReadonly;
  }

  public setSource(path: string) {
    this.source = path;
  }

  public setOutput(output: OutputFile) {
    this.output = output;
  }

  public setCode(code: string) {
    this._code = code;
  }

  public print(): string {
    return this._code ?? "";
  }

  static fromSource(name: string, source: string, dataSource?: string) {
    return new ResolverBase(name, dataSource, source);
  }
}
