import { CodeDocument } from "../codegen";

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

export abstract class ResolverBase {
  abstract readonly kind: ResolverKind;

  public readonly isReadonly: boolean = false;
  public readonly dataSource?: string;
  public readonly code: CodeDocument;

  private readonly _name: string;
  private readonly _source?: string;

  constructor(name: string, dataSource?: string, source?: string) {
    this._name = name;
    this.dataSource = dataSource;
    this.code = CodeDocument.create();

    if (source) {
      this._source = source;
      this.isReadonly = true;
    }
  }

  public print(): string {
    if (this.isReadonly) {
      return this._source ?? "";
    }

    return this.code.print();
  }
}
