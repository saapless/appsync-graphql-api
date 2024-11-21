import { CodeDocument, Statement, tc } from "./code";
import { ExecutionTemplate } from "./ExecutionTemplate";

export enum ResolverKind {
  FIELD_RESOLVER = "FieldResolver",
  FUNCTION_RESOLVER = "FunctionResolver",
}

export abstract class ResolverBase extends ExecutionTemplate {
  abstract readonly kind: ResolverKind;

  public readonly isReadonly: boolean = false;
  public readonly dataSource?: string;

  private readonly _name: string;
  private readonly _code?: CodeDocument;
  private readonly _source?: string;

  constructor(name: string, dataSource?: string, source?: string) {
    super();
    this._name = name;
    this.dataSource = dataSource;

    if (source) {
      this._source = source;
      this.isReadonly = true;
    } else {
      this._code = CodeDocument.create();
    }
  }

  private _throwReadonly() {
    return new Error(
      `Resolver ${this._name} is readonly and most likely was created from source. You cannot mutate a resolver source.`
    );
  }

  public addImport(from: string, value: string, alias?: string) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addImport(from, tc.named(value, alias));
    return this;
  }

  public setRequest(...statements: Statement[]) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addRequestFunction(...statements);
    return this;
  }

  public setResponse(...statements: Statement[]) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    this._code.addResponseFunction(...statements);
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
