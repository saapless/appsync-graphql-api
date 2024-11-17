import { ImportValue } from "./ast/language";
import { CodeNode } from "./CodeNode";

export enum ResolverKind {
  FIELD_RESOLVER = "FieldResolver",
  FUNCTION_RESOLVER = "FunctionResolver",
}

export abstract class Resolver {
  abstract readonly kind: ResolverKind;
  public readonly isReadonly: boolean = false;
  public readonly dataSource?: string;
  private readonly _name: string;
  private readonly _code?: CodeNode;
  private readonly _source?: string;

  constructor(name: string, dataSource?: string, source?: string) {
    this._name = name;
    this.dataSource = dataSource;

    if (source) {
      this._source = source;
      this.isReadonly = true;
    } else {
      this._code = CodeNode.create();
    }
  }

  private _throwReadonly() {
    return new Error(
      `Resolver ${this._name} is readonly and most likely was created from source. You cannot mutate a resolver source.`
    );
  }

  public addImport(from: string, value: Omit<ImportValue, "kind">) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addImport(from, value);
    return this;
  }

  public setRequest(code: string) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addRequestFunction(code);
    return this;
  }

  public setResponse(code: string) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addResponseFunction(code);
    return this;
  }

  public print(): string {
    if (!this._code && !this._source) {
      throw new Error(`Resolver ${this._name} has no source or code to print.`);
    }

    if (!this._code) {
      return this._source ?? "";
    }

    return this._code.print();
  }
}
