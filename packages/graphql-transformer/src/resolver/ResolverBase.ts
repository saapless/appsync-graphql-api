import type { OutputFile } from "esbuild";

export enum ResolverKind {
  FIELD_RESOLVER = "FieldResolver",
  FUNCTION_RESOLVER = "FunctionResolver",
}

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
