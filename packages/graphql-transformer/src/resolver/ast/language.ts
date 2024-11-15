export enum NodeKind {
  CODE_DOCUMENT = "CodeDocument",
  IMPORT_STATEMENT = "ImportStatement",
  IMPORT_VALUE = "ImportValue",
  FUNCTION_DEFINITION = "FunctionDefinition",
  FUNCTION_PARAMETER = "FunctionParameter",
}

export type ImportValue = {
  kind: NodeKind.IMPORT_VALUE;
  type?: boolean;
  value: string;
  alias?: string;
};

export type FunctionParameter = {
  kind: NodeKind.FUNCTION_PARAMETER;
  name: string;
  type?: string;
  default?: string;
};

export type ImportStatementDefinition = {
  kind: NodeKind.IMPORT_STATEMENT;
  default?: ImportValue;
  named?: ImportValue[];
  from: string;
};

export type FunctionDefinition = {
  kind: NodeKind.FUNCTION_DEFINITION;
  name: string;
  exports: boolean;
  parameters: FunctionParameter[];
  body: string;
};

export type CodeDocumentDefinition = {
  kind: NodeKind.CODE_DOCUMENT;
  imports: ImportStatementDefinition[];
  requestFunction: FunctionDefinition;
  responseFunction: FunctionDefinition;
};

export type CodeASTNode =
  | CodeDocumentDefinition
  | ImportStatementDefinition
  | ImportValue
  | FunctionDefinition
  | FunctionParameter;
