import {
  NodeKind,
  DocumentDefinition,
  CodeDeclaration,
  _export,
  ImportDeclaration,
  tc,
  ModuleSpecifier,
  Block,
  ModuleDeclaration,
  Declaration,
  TypeIdentifier,
} from "./ast";
import { printAST } from "./printer";

type ContextArgs = {
  args?: TypeIdentifier;
  stash?: TypeIdentifier;
  prev?: TypeIdentifier;
  source?: TypeIdentifier;
  result?: TypeIdentifier;
};

export class CodeDocument {
  public readonly kind: NodeKind.CODE_DOCUMENT = NodeKind.CODE_DOCUMENT;
  private readonly _imports: ModuleDeclaration[] = [];
  private readonly _declarations: Declaration[] = [];
  private _ctxArgs: ContextArgs = {};
  private readonly _request: Block[] = [];
  private readonly _response: Block[] = [];

  constructor() {}

  private _getImportFrom(from: string): ImportDeclaration | undefined {
    return this._imports.find(
      (node) => node._kind === NodeKind.IMPORT_DECLARATION && node.from.value === from
    ) as ImportDeclaration;
  }

  public addImport(from: string, ...specifier: ModuleSpecifier[]) {
    const current = this._getImportFrom(from);

    if (!current) {
      this._imports.push(tc.import(from, ...specifier));
      return this;
    }

    // Filter already imported named specifiers

    specifier = specifier.filter(
      (spec) =>
        spec._kind === NodeKind.MODULE_NAMED_SPECIFIER &&
        !current.specifiers.some(
          (current) =>
            current._kind === NodeKind.MODULE_NAMED_SPECIFIER &&
            current.value.name === spec.value.name
        )
    );

    const isDefault = specifier.some((spec) => spec._kind === NodeKind.MODULE_DEFAULT_SPECIFIER);
    const isNamespace = specifier.some(
      (spec) => spec._kind === NodeKind.MODULE_NAMESPACE_SPECIFIER
    );

    if (isDefault && isNamespace) {
      throw new Error("Cannot have both default and namespace specifier");
    }

    const hasDefault = current.specifiers.some(
      (spec) => spec._kind === NodeKind.MODULE_DEFAULT_SPECIFIER
    );
    const hasNamespace = current.specifiers.some(
      (spec) => spec._kind === NodeKind.MODULE_NAMESPACE_SPECIFIER
    );

    if ((isDefault || isNamespace) && (hasDefault || hasNamespace)) {
      throw new Error(`Cannot have multiple default or namespace imports for module ${from}`);
    }

    current.specifiers.push(...specifier);
    return this;
  }

  public addDeclaration(...declarations: Declaration[]) {
    this._declarations.push(...declarations);
    return this;
  }

  public setContextArgs(args: ContextArgs) {
    Object.assign(this._ctxArgs, args);
    return this;
  }

  public setRequest(...statements: Block[]) {
    this._request.push(...statements);
    return this;
  }

  public setResponse(...statements: Block[]) {
    this._response.push(...statements);
    return this;
  }

  public build() {
    this.addImport("@aws-appsync/utils", tc.named("Context"));
    const body: CodeDeclaration[] = [...this._imports, ...this._declarations];

    body.push(
      _export(
        tc.func(
          "request",
          [
            tc.ref(
              "ctx",
              tc.typeRef("Context", [
                this._ctxArgs.args ?? tc.typeRef("unknown"),
                this._ctxArgs.stash ??
                  tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("unknown")]),
                this._ctxArgs.prev ?? tc.typeRef("undefined"),
                this._ctxArgs.source ?? tc.typeRef("undefined"),
              ])
            ),
          ],
          this._request ?? []
        )
      )
    );
    body.push(
      _export(
        tc.func(
          "response",
          [
            tc.ref(
              "ctx",
              tc.typeRef("Context", [
                this._ctxArgs.args ?? tc.typeRef("unknown"),
                this._ctxArgs.stash ??
                  tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("unknown")]),
                this._ctxArgs.prev ?? tc.typeRef("undefined"),
                this._ctxArgs.source ?? tc.typeRef("undefined"),
                this._ctxArgs.result ?? tc.typeRef("unknown"),
              ])
            ),
          ],
          this._response ?? []
        )
      )
    );

    return body;
  }

  public serialize(): DocumentDefinition {
    return {
      _kind: this.kind,
      body: this.build(),
    };
  }

  public print(): string {
    return printAST(this.serialize());
  }

  static create() {
    return new CodeDocument();
  }
}
