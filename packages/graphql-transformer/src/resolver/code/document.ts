import { FunctionDefinition, ImportStatementDefinition, ImportValue, NodeKind } from "./language";
import { printAST } from "./printer";

export class CodeDocument {
  kind: NodeKind.CODE_DOCUMENT = NodeKind.CODE_DOCUMENT;
  imports: ImportStatementDefinition[] = [];
  requestFunction: FunctionDefinition;
  responseFunction: FunctionDefinition;

  constructor() {
    this.imports = [
      {
        kind: NodeKind.IMPORT_STATEMENT,
        named: [
          {
            kind: NodeKind.IMPORT_VALUE,
            value: "Context",
            type: true,
          },
        ],
        from: "@aws-appsync/utils",
      },
    ];
    this.requestFunction = {
      kind: NodeKind.FUNCTION_DEFINITION,
      name: "request",
      exports: true,
      parameters: [
        {
          kind: NodeKind.FUNCTION_PARAMETER,
          name: "ctx",
          type: "Context",
        },
      ],
      body: {
        kind: NodeKind.CODE_BLOCK,
        value: "return {}",
      },
    };

    this.responseFunction = {
      kind: NodeKind.FUNCTION_DEFINITION,
      name: "response",
      exports: true,
      parameters: [
        {
          kind: NodeKind.FUNCTION_PARAMETER,
          name: "ctx",
          type: "Context",
        },
      ],
      body: {
        kind: NodeKind.CODE_BLOCK,
        value: "return ctx.result",
      },
    };
  }

  public serialize() {
    return {
      kind: this.kind,
      imports: this.imports,
      requestFunction: this.requestFunction,
      responseFunction: this.responseFunction,
    };
  }

  public print(): string {
    return printAST(this.serialize());
  }

  public addRequestFunction(value: string) {
    this.requestFunction.body = {
      kind: NodeKind.CODE_BLOCK,
      value,
    };

    return this;
  }

  public addResponseFunction(value: string) {
    this.responseFunction.body = {
      kind: NodeKind.CODE_BLOCK,
      value,
    };

    return this;
  }

  private _getImportFrom(from: string) {
    return this.imports.find((imp) => imp.from === from);
  }

  public addImport(from: string, value: Omit<ImportValue, "kind">, defaultImport = false) {
    const current = this._getImportFrom(from);
    if (!current) {
      this.imports.push({
        kind: NodeKind.IMPORT_STATEMENT,
        from,
        default: defaultImport ? { kind: NodeKind.IMPORT_VALUE, ...value } : undefined,
        named: !defaultImport ? [{ kind: NodeKind.IMPORT_VALUE, ...value }] : undefined,
      });

      return this;
    }

    if (defaultImport && current.default) {
      throw new Error(`Default import already exists for ${from}`);
    }

    if (current.named?.find((imp) => imp.value === value.value)) {
      return this;
    }

    if (defaultImport) {
      current.default = { kind: NodeKind.IMPORT_VALUE, ...value };
    } else {
      current.named = current.named ?? [];
      current.named.push({ kind: NodeKind.IMPORT_VALUE, ...value });
    }

    return this;
  }

  static create() {
    return new CodeDocument();
  }
}
