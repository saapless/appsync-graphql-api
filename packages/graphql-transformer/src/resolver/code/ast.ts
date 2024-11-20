export enum NodeKind {
  ARRAY = "Array",
  ARRAY_EXPRESSION = "ArrayExpression",
  ARROW_FUNCTION_EXPRESSION = "ArrowFunctionExpression",
  ASSIGNMENT_EXPRESSION = "AssignmentExpression",
  BINARY_EXPRESSION = "BinaryExpression",
  BLOCK_STATEMENT = "BlockStatement",
  BREAK_STATEMENT = "BreakStatement",
  CALL_EXPRESSION = "CallExpression",
  CODE_DOCUMENT = "CodeDocument",
  CONDITIONAL_EXPRESSION = "ConditionalExpression",
  ELSE_STATEMENT = "ElseStatement",
  EMPTY_STATEMENT = "EmptyStatement",
  EXPORT_ALL_DECLARATION = "ExportAllDeclaration",
  EXPORT_DEFAULT_DECLARATION = "ExportDefaultDeclaration",
  EXPORT_NAMED_DECLARATION = "ExportNamedDeclaration",
  FOR_IN_STATEMENT = "ForInStatement",
  FOR_OF_STATEMENT = "ForOfStatement",
  FUNCTION_DECLARATION = "FunctionDeclaration",
  IDENTIFIER = "Identifier",
  IF_STATEMENT = "IfStatement",
  IMPORT_DECLARATION = "ImportDeclaration",
  LITERAL = "Literal",
  LOGICAL_EXPRESSION = "LogicalExpression",
  MEMBER_EXPRESSION = "MemberExpression",
  MODULE_DEFAULT_SPECIFIER = "ModuleDefaultSpecifier",
  MODULE_NAMED_SPECIFIER = "ModuleNamedSpecifier",
  MODULE_NAMESPACE_SPECIFIER = "ModuleNamespaceSpecifier",
  OBJECT = "Object",
  OBJECT_EXPRESSION = "ObjectExpression",
  // PATAMETER = "Parameter",
  PROPERTY = "Property",
  REST_ELEMENT = "RestElement",
  RETURN_STATEMENT = "ReturnStatement",
  SPREAD_ELEMENT = "SpreadElement",
  SWITCH_CASE = "SwitchCase",
  SWITCH_STATEMENT = "SwitchStatement",
  UNARY_EXPRESSION = "UnaryExpression",
  VARIABLE_DECLRATION = "VariableDeclaration",
}

export interface Node {
  _kind: NodeKind;
}

// #region Pattern

export interface Identifier extends Node {
  _kind: NodeKind.IDENTIFIER;
  name: string;
}

export type LiteralType = "string" | "number" | "boolean" | "undefined" | "null";

export interface Literal extends Node {
  _kind: NodeKind.LITERAL;
  type: LiteralType;
  value: string;
}

export interface Property extends Node {
  _kind: NodeKind.PROPERTY;
  name: string;
  value: Literal | ObjectExpression | ArrayExpression | MemberExpression | Identifier;
}

export interface RestElement extends Node {
  _kind: NodeKind.REST_ELEMENT;
  argument: Identifier;
}

export interface ArrayDefinition extends Node {
  _kind: NodeKind.ARRAY;
  elements: Array<Identifier | RestElement>;
}

export interface ObjectDefinition extends Node {
  _kind: NodeKind.OBJECT;
  properties: Array<Property | RestElement>;
}

export type Pattern = Identifier | ObjectDefinition | ArrayDefinition | RestElement;

export type Argument = Literal | ObjectExpression | ArrayExpression | RestElement;
// #endregion Pattern

// #region Expressions

export interface SpreadElement extends Node {
  _kind: NodeKind.SPREAD_ELEMENT;
  argument: Expression;
}

export interface ArrayExpression extends Node {
  _kind: NodeKind.ARRAY_EXPRESSION;
  elements: Array<Expression | SpreadElement>;
}

export interface ObjectExpression extends Node {
  _kind: NodeKind.OBJECT_EXPRESSION;
  properties: Array<Property | SpreadElement>;
}

export interface ArrowFunctionExpression extends Node {
  _kind: NodeKind.ARROW_FUNCTION_EXPRESSION;
  parameters: Identifier[];
  body: BlockStatement;
}

export type UnaryOperator = "+" | "-" | "!" | "typeof" | "delete";

export interface UnaryExpression extends Node {
  _kind: NodeKind.UNARY_EXPRESSION;
  operator: UnaryOperator;
  argument: Expression;
}

export type BinaryOperator =
  | "=="
  | "!="
  | "==="
  | "!=="
  | "<"
  | "<="
  | ">"
  | ">="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "|"
  | "&"
  | "instanceof";

export interface BinaryExpression extends Node {
  _kind: NodeKind.BINARY_EXPRESSION;
  operator: BinaryOperator;
  left: Pattern;
  right: Expression;
}

export interface AssignmentExpression extends Node {
  _kind: NodeKind.ASSIGNMENT_EXPRESSION;
  operator: "=";
  left: Pattern;
  right: Expression;
}

export interface LogicalExpression extends Node {
  _kind: NodeKind.LOGICAL_EXPRESSION;
  operator: "&&" | "||" | "??";
  left: Expression;
  right: Expression;
}

export interface MemberExpression extends Node {
  _kind: NodeKind.MEMBER_EXPRESSION;
  object: Expression;
  property: Identifier;
  computed: boolean;
  optional: boolean;
}

export interface ConditionalExpression extends Node {
  _kind: NodeKind.CONDITIONAL_EXPRESSION;
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface CallExpression extends Node {
  _kind: NodeKind.CALL_EXPRESSION;
  callee: Expression;
  arguments: Array<Expression | SpreadElement>;
  optional: boolean;
}

export type Expression =
  | Literal
  | Identifier
  | Property
  | ArrayExpression
  | ObjectExpression
  | ArrowFunctionExpression
  | UnaryExpression
  | BinaryExpression
  | AssignmentExpression
  | LogicalExpression
  | MemberExpression
  | ConditionalExpression
  | CallExpression;

// #endregion Expression

// #region Statement
export interface BlockStatement extends Node {
  _kind: NodeKind.BLOCK_STATEMENT;
  body: Statement[];
}

export interface EmptyStatement extends Node {
  _kind: NodeKind.EMPTY_STATEMENT;
}

export interface ReturnStatement extends Node {
  _kind: NodeKind.RETURN_STATEMENT;
  value: Expression | Literal;
}

export interface BreakStatement extends Node {
  _kind: NodeKind.BREAK_STATEMENT;
}

export interface IfStatement extends Node {
  _kind: NodeKind.IF_STATEMENT;
  condition: Expression;
  consequent: Statement;
  alternate?: ElseStatement;
}

export interface ElseStatement extends Node {
  _kind: NodeKind.ELSE_STATEMENT;
  body: Statement;
}

export interface SwitchStatement extends Node {
  _kind: NodeKind.SWITCH_STATEMENT;
  cases: SwitchCase[];
  discriminant?: Expression;
}

export interface SwitchCase extends Node {
  _kind: NodeKind.SWITCH_CASE;
  test?: Expression;
  consequent: Statement[];
}

export interface ForOfStatement extends Node {
  _kind: NodeKind.FOR_OF_STATEMENT;
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Statement;
}

export interface ForInStatement extends Node {
  _kind: NodeKind.FOR_IN_STATEMENT;
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Statement;
}

export type Statement =
  | BlockStatement
  | EmptyStatement
  | ReturnStatement
  | BreakStatement
  | IfStatement
  | SwitchStatement
  | ForOfStatement
  | Declaration;

// #endregion Statement

// #region Declaration

export interface VariableDeclaration extends Node {
  _kind: NodeKind.VARIABLE_DECLRATION;
  name: string;
  value: Expression;
  type: "var" | "let" | "const";
}

export interface FunctionDeclaration extends Node {
  _kind: NodeKind.FUNCTION_DECLARATION;
  name: Identifier;
  parameters: Identifier[];
  body: BlockStatement;
}

export type Declaration = VariableDeclaration | FunctionDeclaration;

// #endregion Declaration

// #region Module

export interface ModuleNamedSpecifier extends Node {
  _kind: NodeKind.MODULE_NAMED_SPECIFIER;
  value: Literal;
  alias?: Literal;
}

export interface ModuleNamespaceSpecifier extends Node {
  _kind: NodeKind.MODULE_NAMESPACE_SPECIFIER;
  alias?: Literal;
}

export interface ModuleDefaultSpecifier extends Node {
  _kind: NodeKind.MODULE_DEFAULT_SPECIFIER;
  value: Literal;
}

export type ImportSpecifier =
  | ModuleNamedSpecifier
  | ModuleNamespaceSpecifier
  | ModuleDefaultSpecifier;

export interface ImportDeclaration extends Node {
  _kind: NodeKind.IMPORT_DECLARATION;
  from: string;
  specifiers: ImportSpecifier[];
}

export interface ExportNamedDeclaration extends Node {
  _kind: NodeKind.EXPORT_NAMED_DECLARATION;
  declaration?: Declaration;
  specifiers?: ModuleNamedSpecifier[];
}

export interface ExportDefaultDeclaration extends Node {
  _kind: NodeKind.EXPORT_DEFAULT_DECLARATION;
  value: Literal;
}

export interface ExportAllDeclaration extends Node {
  _kind: NodeKind.EXPORT_ALL_DECLARATION;
  value: Literal;
}

export type ModuleDeclaration =
  | ImportDeclaration
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ExportAllDeclaration;

// #endregion Module

export type CodeDeclaration = ModuleDeclaration | Declaration;

export interface DocumentDefinition extends Node {
  _kind: NodeKind.CODE_DOCUMENT;
  body: CodeDeclaration[];
}

export type ASTNode =
  | ArrayDefinition
  | ArrayExpression
  | ArrowFunctionExpression
  | AssignmentExpression
  | BinaryExpression
  | BlockStatement
  | BreakStatement
  | CallExpression
  | DocumentDefinition
  | ConditionalExpression
  | ElseStatement
  | EmptyStatement
  | ExportAllDeclaration
  | ExportDefaultDeclaration
  | ExportNamedDeclaration
  | ForInStatement
  | ForOfStatement
  | FunctionDeclaration
  | Identifier
  | IfStatement
  | ImportDeclaration
  | Literal
  | LogicalExpression
  | MemberExpression
  | ModuleNamedSpecifier
  | ModuleNamespaceSpecifier
  | ModuleDefaultSpecifier
  | ObjectDefinition
  | ObjectExpression
  | Property
  | RestElement
  | ReturnStatement
  | SpreadElement
  | SwitchStatement
  | SwitchCase
  | UnaryExpression
  | VariableDeclaration;

export function isNode(object: object | null | undefined): object is ASTNode {
  if (object == null) return false;
  if (typeof object !== "object") return false;
  if (Array.isArray(object)) return object.some((child) => isNode(child));
  return Object.hasOwn(object, "_kind");
}

export function _literal(value?: string | number | boolean | null | undefined): Literal {
  const type =
    value !== null
      ? (["string", "number", "boolean", "undefined"].find(
          (t) => typeof value === t
        ) as LiteralType)
      : "null";

  if (!type) throw new Error(`Invalid literal type ${typeof value}`);

  return {
    _kind: NodeKind.LITERAL,
    value: value?.toString() ?? "",
    type,
  };
}

export function _id(name: string): Identifier {
  return { _kind: NodeKind.IDENTIFIER, name };
}

export function _prop(
  name: string,
  value: Literal | ObjectExpression | ArrayExpression | MemberExpression | Identifier
): Property {
  return { _kind: NodeKind.PROPERTY, name, value };
}

export function _rest(id: Identifier): RestElement {
  return { _kind: NodeKind.REST_ELEMENT, argument: id };
}

export function _spread(arg: Expression): SpreadElement {
  return { _kind: NodeKind.SPREAD_ELEMENT, argument: arg };
}

export function _object(properties: Array<Property | RestElement>): ObjectDefinition {
  return { _kind: NodeKind.OBJECT, properties };
}

export function _array(elements: Array<Identifier | RestElement>): ArrayDefinition {
  return { _kind: NodeKind.ARRAY, elements };
}

export function _default(value: Literal): ModuleDefaultSpecifier {
  return { _kind: NodeKind.MODULE_DEFAULT_SPECIFIER, value };
}

export function _namespace(alias?: Literal): ModuleNamespaceSpecifier {
  return { _kind: NodeKind.MODULE_NAMESPACE_SPECIFIER, alias };
}

export function _named(value: string, alias?: string): ModuleNamedSpecifier {
  return {
    _kind: NodeKind.MODULE_NAMED_SPECIFIER,
    value: _literal(value),
    alias: alias ? _literal(alias) : undefined,
  };
}

export function _import(from: string, ...specifiers: ImportSpecifier[]): ImportDeclaration {
  return { _kind: NodeKind.IMPORT_DECLARATION, from, specifiers };
}

export function _export(
  value: Declaration | ModuleNamedSpecifier | ModuleNamedSpecifier[]
): ExportNamedDeclaration {
  const isDeclaration =
    !Array.isArray(value) &&
    (value._kind === NodeKind.FUNCTION_DECLARATION || value._kind === NodeKind.VARIABLE_DECLRATION);
  return {
    _kind: NodeKind.EXPORT_NAMED_DECLARATION,
    declaration: isDeclaration ? value : undefined,
    specifiers: isDeclaration
      ? undefined
      : Array.isArray(value)
        ? value
        : ([value] as ModuleNamedSpecifier[]),
  };
}

export function _exportDefault(value: Literal): ExportDefaultDeclaration {
  return { _kind: NodeKind.EXPORT_DEFAULT_DECLARATION, value };
}

export function _exportAll(value: Literal): ExportAllDeclaration {
  return { _kind: NodeKind.EXPORT_ALL_DECLARATION, value };
}

export function _block(...statements: Statement[]): BlockStatement {
  return { _kind: NodeKind.BLOCK_STATEMENT, body: statements };
}

export function _empty(): EmptyStatement {
  return { _kind: NodeKind.EMPTY_STATEMENT };
}

export function _return(value: Expression | Literal): ReturnStatement {
  return { _kind: NodeKind.RETURN_STATEMENT, value };
}

export function _break(): BreakStatement {
  return { _kind: NodeKind.BREAK_STATEMENT };
}

export function _if(
  condition: Expression,
  consequent: Statement | Statement[],
  altername?: Statement
): IfStatement {
  return {
    _kind: NodeKind.IF_STATEMENT,
    condition,
    consequent: Array.isArray(consequent) ? _block(...consequent) : _block(consequent),
    alternate: altername ? _else(altername) : undefined,
  };
}

export function _else(body: Statement): ElseStatement {
  return { _kind: NodeKind.ELSE_STATEMENT, body: _block(body) };
}

export function _switch(discriminant: Expression, cases: SwitchCase[]): SwitchStatement {
  return {
    _kind: NodeKind.SWITCH_STATEMENT,
    cases,
    discriminant,
  };
}

export function _case(test: Expression | null, consequent: Statement[]): SwitchCase {
  return {
    _kind: NodeKind.SWITCH_CASE,
    test: test ?? undefined,
    consequent,
  };
}

export function _forOf(
  left: VariableDeclaration | Identifier,
  right: Expression,
  body: Statement
): ForOfStatement {
  return {
    _kind: NodeKind.FOR_OF_STATEMENT,
    left,
    right,
    body: _block(body),
  };
}

export function _forIn(
  left: VariableDeclaration | Identifier,
  right: Expression,
  body: Statement
): ForInStatement {
  return {
    _kind: NodeKind.FOR_IN_STATEMENT,
    left,
    right,
    body: _block(body),
  };
}

export function _arrow(
  params: Identifier[],
  body: Statement | Statement[]
): ArrowFunctionExpression {
  return {
    _kind: NodeKind.ARROW_FUNCTION_EXPRESSION,
    parameters: params,
    body: Array.isArray(body) ? _block(...body) : _block(body),
  };
}

export function _add(arg: Expression): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "+",
    argument: arg,
  };
}

export function _substract(arg: Expression): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "-",
    argument: arg,
  };
}

export function _not(arg: Expression): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "!",
    argument: arg,
  };
}

export function _typeof(arg: Expression): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "typeof",
    argument: arg,
  };
}

export function _delete(arg: Expression): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "delete",
    argument: arg,
  };
}

export function _eq(left: Pattern, right: Expression, loose = false): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: loose ? "==" : "===",
    left,
    right,
  };
}

export function _neq(left: Pattern, right: Expression, loose = false): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: loose ? "!=" : "!==",
    left,
    right,
  };
}

export function _gt(left: Pattern, right: Expression): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: ">",
    left,
    right,
  };
}

export function _gte(left: Pattern, right: Expression): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: ">=",
    left,
    right,
  };
}

export function _lt(left: Pattern, right: Expression): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "<",
    left,
    right,
  };
}

export function _lte(left: Pattern, right: Expression): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "<=",
    left,
    right,
  };
}

export function _assign(left: Pattern, right: Expression): AssignmentExpression {
  return {
    _kind: NodeKind.ASSIGNMENT_EXPRESSION,
    operator: "=",
    left,
    right,
  };
}

export function _and(left: Expression, right: Expression): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "&&",
    left,
    right,
  };
}

export function _or(left: Expression, right: Expression): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "||",
    left,
    right,
  };
}

export function _coalesce(left: Expression, right: Expression): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "??",
    left,
    right,
  };
}

export function _ternary(
  test: Expression,
  consequent: Expression,
  alternate: Expression
): ConditionalExpression {
  return {
    _kind: NodeKind.CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
  };
}

export function _call(
  callee: Expression,
  args: (Expression | SpreadElement)[],
  optional = false
): CallExpression {
  return {
    _kind: NodeKind.CALL_EXPRESSION,
    callee: callee,
    arguments: args,
    optional,
  };
}

export function _obj(...properties: (Property | SpreadElement)[]): ObjectExpression {
  return { _kind: NodeKind.OBJECT_EXPRESSION, properties: properties };
}

export function _member(
  object: Identifier | MemberExpression,
  property: Identifier
): MemberExpression {
  return {
    _kind: NodeKind.MEMBER_EXPRESSION,
    object: object,
    property: property,
    computed: false,
    optional: false,
  };
}

export function _chain(value: string): MemberExpression | Identifier {
  const nodes = value.split(".");
  if (nodes.length === 1) return _id(nodes[0]);
  if (nodes.length === 2) return _member(_id(nodes[0]), _id(nodes[1]));

  return nodes.reduce(
    (prev, current) => {
      if (!prev._kind) return _id(current);
      return _member(prev, _id(current));
    },
    {} as MemberExpression | Identifier
  );
}

export function _func(
  name: string,
  params: (Identifier | string)[],
  body: Statement | Statement[]
): FunctionDeclaration {
  return {
    _kind: NodeKind.FUNCTION_DECLARATION,
    name: _id(name),
    parameters: params.map((id) => (typeof id === "string" ? _id(id) : id)),
    body: Array.isArray(body) ? _block(...body) : _block(body),
  };
}

export function _var(name: string, value: Expression): VariableDeclaration {
  return { _kind: NodeKind.VARIABLE_DECLRATION, name, value, type: "var" };
}

export function _let(name: string, value: Expression): VariableDeclaration {
  return { _kind: NodeKind.VARIABLE_DECLRATION, name, value, type: "let" };
}

export function _const(name: string, value: Expression): VariableDeclaration {
  return { _kind: NodeKind.VARIABLE_DECLRATION, name, value, type: "const" };
}
