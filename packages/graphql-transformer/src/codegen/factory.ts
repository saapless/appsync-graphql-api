import * as ts from "typescript";

function _ref(identifier: string) {
  return ts.factory.createIdentifier(identifier);
}

// #region Literals
function _str(string: string) {
  return ts.factory.createStringLiteral(string);
}

function _num(num: number) {
  return ts.factory.createNumericLiteral(num);
}

function _bool(bool: boolean) {
  return bool ? ts.factory.createTrue() : ts.factory.createFalse();
}

function _null() {
  return ts.factory.createNull();
}

/**
 * Literals
 */
export const l = {
  str: _str,
  num: _num,
  bool: _bool,
  null: _null,
};

// #endregion Literals

// #region Types

function _typeRef(identifier: string, args?: ts.TypeNode[]) {
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier), args);
}

function _typeParam(name: string, constraint?: ts.TypeNode, defaultType?: ts.TypeNode) {
  return ts.factory.createTypeParameterDeclaration(
    undefined,
    ts.factory.createIdentifier(name),
    constraint,
    defaultType
  );
}

function _typeUnion(...types: ts.TypeNode[]) {
  return ts.factory.createUnionTypeNode(types);
}

function _typeIntersect(...types: ts.TypeNode[]) {
  return ts.factory.createIntersectionTypeNode(types);
}

function _typeDef(
  name: string,
  type: ts.TypeNode,
  params?: ts.TypeParameterDeclaration[],
  modifiers?: ts.ModifierLike[]
) {
  return ts.factory.createTypeAliasDeclaration(
    modifiers ?? undefined,
    ts.factory.createIdentifier(name),
    params,
    type
  );
}

function _typeLiteral(members: ts.TypeElement[]) {
  return ts.factory.createTypeLiteralNode(members);
}

function _typeProp(name: string, type: ts.TypeNode, optional = false, modifiers?: ts.Modifier[]) {
  return ts.factory.createPropertySignature(
    modifiers ?? undefined,
    ts.factory.createIdentifier(name),
    optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
    type
  );
}

function _ifaceDef(
  name: string,
  members: ts.TypeElement[],
  params?: ts.TypeParameterDeclaration[],
  modifiers?: ts.ModifierLike[]
) {
  return ts.factory.createInterfaceDeclaration(
    modifiers ?? undefined,
    ts.factory.createIdentifier(name),
    params,
    undefined,
    members
  );
}

/**
 * Types
 */

export const t = {
  ref: _typeRef,
  param: _typeParam,
  union: _typeUnion,
  intersect: _typeIntersect,
  def: _typeDef,
  iface: _ifaceDef,
  literal: _typeLiteral,
  prop: _typeProp,
};

// #endregion Types

// #region Declarations
function _func(
  name: string,
  params: ts.ParameterDeclaration[],
  body: ts.Block,
  typeParams?: ts.TypeParameterDeclaration[],
  returnType?: ts.TypeNode,
  modifiers?: ts.ModifierLike[]
) {
  return ts.factory.createFunctionDeclaration(
    modifiers ?? undefined,
    undefined,
    ts.factory.createIdentifier(name),
    typeParams,
    params,
    returnType,
    body
  );
}

/**
 * Declarations
 */
export const d = {
  func: _func,
};

// #endregion Declarations

// #region Statements

function _const(name: string, init: ts.Expression, type?: ts.TypeNode) {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(name, undefined, type, init)],
      ts.NodeFlags.Const
    )
  );
}

function _let(name: string, init: ts.Expression, type?: ts.TypeNode) {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(name, undefined, type, init)],
      ts.NodeFlags.Let
    )
  );
}

/**
 * Statements
 */
export const s = {
  const: _const,
  let: _let,
};

// #endregion Statements

// #region Expressions

/**
 * Expressions
 */
export const e = {};
// #endregion Expressions

// #region Modules
function _import(from: string, clause: ts.ImportClause) {
  return ts.factory.createImportDeclaration(
    undefined,
    clause,
    ts.factory.createStringLiteral(from)
  );
}

function _export(): ts.ExportKeyword {
  return ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
}

export const m = {
  import: _import,
  export: _export,
};
// #endregion Modules

/**
 * Code AST Factory
 */
export const cf = {
  ref: _ref,
  /** Literals */
  l,
  /** Types */
  t,
  /** Declarations */
  d,
  /** Statements */
  s,
  /** Expressions */
  e,
  /** Modules */
  m,
};
