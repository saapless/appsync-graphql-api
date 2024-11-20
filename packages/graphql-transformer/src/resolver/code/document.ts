import {
  NodeKind,
  DocumentDefinition,
  CodeDeclaration,
  Statement,
  _export,
  _func,
  _id,
  ImportSpecifier,
  _import,
  ImportDeclaration,
} from "./ast";
import { printAST } from "./printer";

export class CodeDocument {
  public readonly kind: NodeKind.CODE_DOCUMENT = NodeKind.CODE_DOCUMENT;
  public readonly body: CodeDeclaration[] = [];
  constructor() {}

  public serialize(): DocumentDefinition {
    return {
      _kind: this.kind,
      body: this.body,
    };
  }

  public print(): string {
    return printAST(this.serialize());
  }

  public hasDeclaration(name: string): boolean {
    return this.body.some((node) => {
      if (node._kind === NodeKind.FUNCTION_DECLARATION) {
        return node.name.name === name;
      }

      if (node._kind === NodeKind.VARIABLE_DECLRATION) {
        return node.name === name;
      }

      if (node._kind === NodeKind.EXPORT_NAMED_DECLARATION && node.declaration) {
        return node.declaration._kind === NodeKind.FUNCTION_DECLARATION
          ? node.declaration.name.name === name
          : node.declaration.name === name;
      }
    });
  }

  public addRequestFunction(...statements: Statement[]) {
    if (this.hasDeclaration("request")) {
      throw new Error("Request function already exists");
    }

    this.body.push(_export(_func("request", [_id("ctx")], statements)));
    return this;
  }

  public addResponseFunction(...statements: Statement[]) {
    if (this.hasDeclaration("response")) {
      throw new Error("Response function already exists");
    }

    this.body.push(_export(_func("response", [_id("ctx")], statements)));

    return this;
  }

  private _getImportFrom(from: string): ImportDeclaration | undefined {
    return this.body.find(
      (node) => node._kind === NodeKind.IMPORT_DECLARATION && node.from === from
    ) as ImportDeclaration;
  }

  public addImport(from: string, ...specifier: ImportSpecifier[]) {
    const current = this._getImportFrom(from);

    if (!current) {
      this.body.push(_import(from, ...specifier));
      return this;
    }

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

  static create() {
    return new CodeDocument();
  }
}
