export enum NodeKind {
  ARRAY = "Array",
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
  EXPORT_DECLARATION = "ExportDeclaration",
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
  PROPERTY = "Property",
  REST_ELEMENT = "RestElement",
  RETURN_STATEMENT = "ReturnStatement",
  SPREAD_ELEMENT = "SpreadElement",
  SWITCH_CASE = "SwitchCase",
  SWITCH_STATEMENT = "SwitchStatement",
  UNARY_EXPRESSION = "UnaryExpression",
  VARIABLE_DECLRATION = "VariableDeclaration",
  TYPE_DECLARATION = "TypeDeclaration",
  TYPE_IDENTIFIER = "TypeIdentifier",
  TYPE_PROPERTY = "TypeProperty",
  TYPE_DEFINITION = "TypeDefinition",
  INTERFACE_DECLARATION = "InterfaceDeclaration",
  AS_EXPRESSION = "AsExpression",
  TYPE_CONDITIONAL_EXPRESSION = "ConditionalTypeExpression",
  TYPE_BINARY_EXPRESSION = "TypeBinaryExpression",
  TYPE_EXTENDS_EXPRESSION = "TypeExtendsExpression",
  TYPE_TUPLE_EXPRESSION = "TypeTupleExpression",
}

export interface Node {
  _kind: NodeKind;
}

// #region Literal

export type LiteralType = "string" | "number" | "boolean" | "null" | "undefined" | "template";

export interface StringLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "string";
  value: string;
}

function _str(string: string): StringLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "string",
    value: String(string),
  };
}

export interface NumberLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "number";
  value: string;
}

function _num(number: number): NumberLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "number",
    value: String(number),
  };
}

export interface BooleanLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "boolean";
  value: string;
}

export function _bool(bool: boolean): BooleanLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "boolean",
    value: String(bool),
  };
}

export interface NullLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "null";
  value: string;
}

export function _null(): NullLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "null",
    value: String(null),
  };
}

export interface UndefinedLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "undefined";
  value: string;
}

function _undef(): UndefinedLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "undefined",
    value: String(undefined),
  };
}

export interface TemplateLiteral extends Node {
  _kind: NodeKind.LITERAL;
  type: "template";
  value: string;
}

function _tick(template: string): TemplateLiteral {
  return {
    _kind: NodeKind.LITERAL,
    type: "template",
    value: template,
  };
}

export const literal = {
  str: _str,
  num: _num,
  bool: _bool,
  null: _null,
  undef: _undef,
  tick: _tick,
};

export type Literal =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | TemplateLiteral;

// #endregion Literal

// #region Types

export interface TypeIdentifier extends Node {
  _kind: NodeKind.TYPE_IDENTIFIER;
  name: string;
  parameters?: Array<TypeExpression>;
}

function _typeRef(name: string, params?: Array<TypeExpression>): TypeIdentifier {
  return {
    _kind: NodeKind.TYPE_IDENTIFIER,
    name,
    parameters: params,
  };
}

export interface TypeBinaryExpression extends Node {
  _kind: NodeKind.TYPE_BINARY_EXPRESSION;
  operator: string;
  operands: Array<TypeIdentifier | TypeBinaryExpression | Literal>;
}

function _typeUnion(
  operands: Array<TypeIdentifier | TypeBinaryExpression | Literal | string>
): TypeBinaryExpression {
  return {
    _kind: NodeKind.TYPE_BINARY_EXPRESSION,
    operator: "|",
    operands: operands.map((operand) =>
      typeof operand === "string" ? _typeRef(operand) : operand
    ),
  };
}

function _typeIntersect(
  operands: Array<TypeIdentifier | TypeBinaryExpression | string>
): TypeBinaryExpression {
  return {
    _kind: NodeKind.TYPE_BINARY_EXPRESSION,
    operator: "&",
    operands: operands.map((operand) =>
      typeof operand === "string" ? _typeRef(operand) : operand
    ),
  };
}

export interface TypeProperty extends Node {
  _kind: NodeKind.TYPE_PROPERTY;
  name: string;
  optional: boolean;
  type: TypeExpression;
}

function _typeProp(name: string, type: TypeExpression, optional = false): TypeProperty {
  return {
    _kind: NodeKind.TYPE_PROPERTY,
    name,
    optional,
    type,
  };
}

export interface TypeDefinition extends Node {
  _kind: NodeKind.TYPE_DEFINITION;
  properties: Array<TypeProperty>;
}

function _typeObj(props: Array<TypeProperty>): TypeDefinition {
  return {
    _kind: NodeKind.TYPE_DEFINITION,
    properties: props,
  };
}

export interface TypeDeclaration extends Node {
  _kind: NodeKind.TYPE_DECLARATION;
  name: TypeIdentifier;
  definition: TypeExpression;
}

function _typeDef(name: string | TypeIdentifier, props: TypeExpression): TypeDeclaration {
  return {
    _kind: NodeKind.TYPE_DECLARATION,
    name: typeof name === "string" ? _typeRef(name) : name,
    definition: props,
  };
}

export interface InterfaceDeclaration extends Node {
  _kind: NodeKind.INTERFACE_DECLARATION;
  name: TypeIdentifier;
  definition: TypeDefinition;
  extension?: Array<TypeIdentifier>;
}

function _iface(
  name: TypeIdentifier | string,
  definition: TypeDefinition,
  extension?: Array<TypeIdentifier | string>
): InterfaceDeclaration {
  return {
    _kind: NodeKind.INTERFACE_DECLARATION,
    name: typeof name === "string" ? _typeRef(name) : name,
    definition: definition,
    extension: extension?.map((ext) => (typeof ext === "string" ? _typeRef(ext) : ext)),
  };
}

export interface TypeExtendsExpression extends Node {
  _kind: NodeKind.TYPE_EXTENDS_EXPRESSION;
  left: TypeIdentifier;
  right: TypeExpression;
}

function _typeExtends(name: string | TypeIdentifier, right: TypeExpression): TypeExtendsExpression {
  return {
    _kind: NodeKind.TYPE_EXTENDS_EXPRESSION,
    left: typeof name === "string" ? _typeRef(name) : name,
    right,
  };
}

export interface TypeTupleExpression extends Node {
  _kind: NodeKind.TYPE_TUPLE_EXPRESSION;
  elements: Array<TypeExpression>;
}

function _typeTuple(...elements: Array<TypeExpression>): TypeTupleExpression {
  return {
    _kind: NodeKind.TYPE_TUPLE_EXPRESSION,
    elements,
  };
}

export type TypeExpression =
  | TypeIdentifier
  | TypeBinaryExpression
  | Literal
  | TypeDefinition
  | TypeExtendsExpression
  | TypeTupleExpression;

const types = {
  typeRef: _typeRef,
  typeUnion: _typeUnion,
  typeIntersect: _typeIntersect,
  typeProp: _typeProp,
  typeDef: _typeDef,
  typeInterface: _iface,
  typeObj: _typeObj,
  typeExtends: _typeExtends,
  typeTuple: _typeTuple,
};

// #endregion Types
// #region Definition

export interface Identifier extends Node {
  _kind: NodeKind.IDENTIFIER;
  name: string;
  type?: TypeIdentifier;
}

function _ref(name: string, type?: TypeIdentifier): Identifier {
  return {
    _kind: NodeKind.IDENTIFIER,
    name,
    type,
  };
}

export interface SpreadElement extends Node {
  _kind: NodeKind.SPREAD_ELEMENT;
  argument: Identifier | Expression;
}

function _spread(arg: Expression | string): SpreadElement {
  return {
    _kind: NodeKind.SPREAD_ELEMENT,
    argument: typeof arg === "string" ? _ref(arg) : arg,
  };
}

export interface RestElement extends Node {
  _kind: NodeKind.REST_ELEMENT;
  argument: Identifier;
}

function _rest(arg: string): RestElement {
  return {
    _kind: NodeKind.REST_ELEMENT,
    argument: _ref(arg),
  };
}

export type DefinitionPattern = Identifier | ObjectDefinition | ArrayDefinition | RestElement;

export type PropertyValue = Definition | Expression | Identifier | Literal;

export interface Property extends Node {
  _kind: NodeKind.PROPERTY;
  name: string;
  value: PropertyValue;
}

type Operand = Literal | Definition | Expression;

type Argument = Literal | DefinitionPattern | Expression;

function _prop(name: string, value: PropertyValue): Property {
  return { _kind: NodeKind.PROPERTY, name, value };
}

export interface ObjectDefinition extends Node {
  _kind: NodeKind.OBJECT;
  properties: Array<Property | Identifier | SpreadElement | RestElement>;
}

function _obj(
  ...props: Array<
    Property | Identifier | SpreadElement | RestElement | Record<string, PropertyValue>
  >
): ObjectDefinition {
  const properties = props
    .map((prop) => {
      if (isNode(prop)) return prop;
      return Object.entries(prop).map(([key, value]) => _prop(key, value as PropertyValue));
    })
    .flat();

  return {
    _kind: NodeKind.OBJECT,
    properties: properties as Property[],
  };
}

export interface ArrayDefinition extends Node {
  _kind: NodeKind.ARRAY;
  elements: Array<
    DefinitionPattern | SpreadElement | RestElement | Literal | MemberExpression | PropertyValue
  >;
}

function _arr(
  ...elements: Array<
    DefinitionPattern | SpreadElement | RestElement | Literal | MemberExpression | PropertyValue
  >
): ArrayDefinition {
  return {
    _kind: NodeKind.ARRAY,
    elements,
  };
}

export type Definition =
  | ObjectDefinition
  | ArrayDefinition
  | Identifier
  | RestElement
  | SpreadElement;

export const definition = {
  obj: _obj,
  arr: _arr,
  spread: _spread,
  rest: _rest,
  ref: _ref,
  prop: _prop,
};

// #endregion Definition

// #region Expressions

export interface ArrowFunctionExpression extends Node {
  _kind: NodeKind.ARROW_FUNCTION_EXPRESSION;
  parameters: Argument[];
  body: Block | Literal;
}

function _arrow(params: Argument | Argument[], body: Block | Literal): ArrowFunctionExpression {
  return {
    _kind: NodeKind.ARROW_FUNCTION_EXPRESSION,
    parameters: Array.isArray(params) ? params : [params],
    body,
  };
}

export type UnaryOperator = "!" | "typeof" | "delete";

export interface UnaryExpression extends Node {
  _kind: NodeKind.UNARY_EXPRESSION;
  operator: UnaryOperator;
  argument: Operand;
}

function _not(arg: Operand): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "!",
    argument: arg,
  };
}

function _typeof(arg: Operand): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "typeof",
    argument: arg,
  };
}

function _delete(arg: Operand): UnaryExpression {
  return {
    _kind: NodeKind.UNARY_EXPRESSION,
    operator: "delete",
    argument: arg,
  };
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
  | "&";

export interface BinaryExpression extends Node {
  _kind: NodeKind.BINARY_EXPRESSION;
  operator: BinaryOperator;
  left: Operand;
  right: Operand;
}

function _eq(left: Operand, right: Operand, loose = false): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: loose ? "==" : "===",
    left,
    right,
  };
}

function _neq(left: Operand, right: Operand, loose = false): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: loose ? "!=" : "!==",
    left,
    right,
  };
}

function _gt(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: ">",
    left,
    right,
  };
}

function _gte(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: ">=",
    left,
    right,
  };
}

function _lt(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "<",
    left,
    right,
  };
}

function _lte(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "<=",
    left,
    right,
  };
}

function _add(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "+",
    left,
    right,
  };
}

function _substract(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "-",
    left,
    right,
  };
}

function _multiply(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "*",
    left,
    right,
  };
}

function _divide(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "/",
    left,
    right,
  };
}

function _modulo(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "%",
    left,
    right,
  };
}

function _union(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "|",
    left,
    right,
  };
}

function _intersect(left: Operand, right: Operand): BinaryExpression {
  return {
    _kind: NodeKind.BINARY_EXPRESSION,
    operator: "&",
    left,
    right,
  };
}

export interface AssignmentExpression extends Node {
  _kind: NodeKind.ASSIGNMENT_EXPRESSION;
  operator: "=";
  left: Operand;
  right: Operand;
}

export function _assign(left: Operand, right: Operand): AssignmentExpression {
  return {
    _kind: NodeKind.ASSIGNMENT_EXPRESSION,
    operator: "=",
    left,
    right,
  };
}

export interface LogicalExpression extends Node {
  _kind: NodeKind.LOGICAL_EXPRESSION;
  operator: "&&" | "||" | "??";
  left: Operand;
  right: Operand;
}

function _and(left: Operand, right: Operand): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "&&",
    left,
    right,
  };
}

function _or(left: Operand, right: Operand): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "||",
    left,
    right,
  };
}

function _coalesce(left: Operand, right: Operand): LogicalExpression {
  return {
    _kind: NodeKind.LOGICAL_EXPRESSION,
    operator: "??",
    left,
    right,
  };
}

export interface MemberExpression extends Node {
  _kind: NodeKind.MEMBER_EXPRESSION;
  object: Operand;
  property: Identifier;
  computed: boolean;
  optional: boolean;
}

function _member(object: Operand, property: Identifier, optional = false): MemberExpression {
  return {
    _kind: NodeKind.MEMBER_EXPRESSION,
    object: object,
    property: property,
    computed: false,
    optional: optional,
  };
}

function _chain(...value: string[]): MemberExpression | Identifier {
  const nodes = value.map((str) => str.split(".")).flat();
  if (nodes.length === 1) return _ref(nodes[0]);
  if (nodes.length === 2) return _member(_ref(nodes[0]), _ref(nodes[1]));

  return nodes.reduce(
    (prev, current) => {
      if (!prev._kind) return _ref(current);
      return _member(prev, _ref(current));
    },
    {} as MemberExpression | Identifier
  );
}

export interface ConditionalExpression extends Node {
  _kind: NodeKind.CONDITIONAL_EXPRESSION;
  test: Expression;
  consequent: Operand;
  alternate: Operand;
}

function _ternary(
  test: Expression,
  consequent: Operand,
  alternate: Operand
): ConditionalExpression {
  return {
    _kind: NodeKind.CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
  };
}

export interface CallExpression extends Node {
  _kind: NodeKind.CALL_EXPRESSION;
  callee: Operand;
  arguments: Array<Argument>;
  optional: boolean;
}

function _call(callee: Operand, args: Argument | Argument[], optional = false): CallExpression {
  return {
    _kind: NodeKind.CALL_EXPRESSION,
    callee: callee,
    arguments: Array.isArray(args) ? args : [args],
    optional,
  };
}

export type Expression =
  | ArrowFunctionExpression
  | UnaryExpression
  | BinaryExpression
  | AssignmentExpression
  | LogicalExpression
  | MemberExpression
  | ConditionalExpression
  | CallExpression;

export const expression = {
  arrow: _arrow,
  not: _not,
  typeof: _typeof,
  delete: _delete,
  eq: _eq,
  neq: _neq,
  gt: _gt,
  gte: _gte,
  lt: _lt,
  lte: _lte,
  add: _add,
  substract: _substract,
  multiply: _multiply,
  divide: _divide,
  modulo: _modulo,
  union: _union,
  intersect: _intersect,
  assign: _assign,
  and: _and,
  or: _or,
  coalesce: _coalesce,
  chain: _chain,
  ternary: _ternary,
  call: _call,
};

// #endregion Expression

// #region Statement
export type Block = Statement | Expression | Definition | TypeIdentifier;

export interface BlockStatement extends Node {
  _kind: NodeKind.BLOCK_STATEMENT;
  statements: Array<Block>;
}

function _block(...statements: Array<Block>): BlockStatement {
  return { _kind: NodeKind.BLOCK_STATEMENT, statements };
}

export interface EmptyStatement extends Node {
  _kind: NodeKind.EMPTY_STATEMENT;
}

function _empty(): EmptyStatement {
  return { _kind: NodeKind.EMPTY_STATEMENT };
}

export interface ReturnStatement extends Node {
  _kind: NodeKind.RETURN_STATEMENT;
  value: Expression | Literal | Definition;
}

function _return(value: Expression | Literal | Definition): ReturnStatement {
  return { _kind: NodeKind.RETURN_STATEMENT, value };
}

export interface BreakStatement extends Node {
  _kind: NodeKind.BREAK_STATEMENT;
}

function _break(): BreakStatement {
  return { _kind: NodeKind.BREAK_STATEMENT };
}

export interface IfStatement extends Node {
  _kind: NodeKind.IF_STATEMENT;
  condition: Expression | Definition;
  consequent: Block;
  alternate?: Block;
}

function _if(
  condition: Expression | Definition,
  consequent: Block,
  altername?: Block
): IfStatement {
  return {
    _kind: NodeKind.IF_STATEMENT,
    condition,
    consequent: Array.isArray(consequent) ? _block(...consequent) : _block(consequent),
    alternate: altername ? _else(altername) : undefined,
  };
}

export interface ElseStatement {
  _kind: NodeKind.ELSE_STATEMENT;
  consequent: Block;
}

function _else(consequent: Block): ElseStatement {
  return {
    _kind: NodeKind.ELSE_STATEMENT,
    consequent,
  };
}

export interface SwitchStatement extends Node {
  _kind: NodeKind.SWITCH_STATEMENT;
  cases: SwitchCase[];
  discriminant: Expression | Identifier;
}

function _switch(discriminant: Expression | Identifier, cases: SwitchCase[]): SwitchStatement {
  return {
    _kind: NodeKind.SWITCH_STATEMENT,
    cases,
    discriminant,
  };
}

export interface SwitchCase extends Node {
  _kind: NodeKind.SWITCH_CASE;
  test?: Operand;
  consequent: (Statement | Expression)[];
}

function _case(
  test: Operand | null,
  consequent: Statement | Expression | (Statement | Expression)[]
): SwitchCase {
  return {
    _kind: NodeKind.SWITCH_CASE,
    test: test ?? undefined,
    consequent: Array.isArray(consequent) ? consequent : [consequent],
  };
}

export interface ForOfStatement extends Node {
  _kind: NodeKind.FOR_OF_STATEMENT;
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Block;
}

function _forOf(
  left: VariableDeclaration | Identifier,
  right: Expression,
  body: Block
): ForOfStatement {
  return {
    _kind: NodeKind.FOR_OF_STATEMENT,
    left,
    right,
    body: _block(body),
  };
}

export interface ForInStatement extends Node {
  _kind: NodeKind.FOR_IN_STATEMENT;
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Block;
}

function _forIn(
  left: VariableDeclaration | Identifier,
  right: Expression,
  body: Block
): ForInStatement {
  return {
    _kind: NodeKind.FOR_IN_STATEMENT,
    left,
    right,
    body: _block(body),
  };
}

export type Statement =
  | BlockStatement
  | EmptyStatement
  | ReturnStatement
  | BreakStatement
  | IfStatement
  | SwitchStatement
  | ForOfStatement
  | Declaration
  | ElseStatement;

export const statement = {
  block: _block,
  empty: _empty,
  return: _return,
  break: _break,
  if: _if,
  switch: _switch,
  case: _case,
  forOf: _forOf,
  forIn: _forIn,
};

// #endregion Statement

// #region Declaration

export interface VariableDeclaration extends Node {
  _kind: NodeKind.VARIABLE_DECLRATION;
  name: Identifier | ObjectDefinition | ArrayDefinition;
  value?: Expression | Definition | Literal;
  type: "var" | "let" | "const";
}

export function _var(
  name: string | Identifier | ObjectDefinition | ArrayDefinition,
  value: Expression | Definition | Literal
): VariableDeclaration {
  return {
    _kind: NodeKind.VARIABLE_DECLRATION,
    name: typeof name === "string" ? _ref(name) : name,
    value,
    type: "var",
  };
}

export function _let(
  name: string | Identifier | ObjectDefinition | ArrayDefinition,
  value: Expression | Definition | Literal
): VariableDeclaration {
  return {
    _kind: NodeKind.VARIABLE_DECLRATION,
    name: typeof name === "string" ? _ref(name) : name,
    value,
    type: "let",
  };
}

function _const(
  name: string | Identifier | ObjectDefinition | ArrayDefinition,
  value?: Expression | Definition | Literal
): VariableDeclaration {
  return {
    _kind: NodeKind.VARIABLE_DECLRATION,
    name: typeof name === "string" ? _ref(name) : name,
    value,
    type: "const",
  };
}

export interface FunctionDeclaration extends Node {
  _kind: NodeKind.FUNCTION_DECLARATION;
  name: Identifier;
  parameters: Argument[];
  body: BlockStatement;
}

function _func(
  name: string,
  params: Argument | Argument[],
  body: Block | Block[]
): FunctionDeclaration {
  return {
    _kind: NodeKind.FUNCTION_DECLARATION,
    name: _ref(name),
    parameters: Array.isArray(params) ? params : [params],
    body: Array.isArray(body) ? _block(...body) : _block(body),
  };
}

export type Declaration = VariableDeclaration | FunctionDeclaration;

export const declaration = {
  var: _var,
  let: _let,
  const: _const,
  func: _func,
};

// #endregion Declaration

// #region Module

export interface ModuleNamedSpecifier extends Node {
  _kind: NodeKind.MODULE_NAMED_SPECIFIER;
  value: Identifier;
  alias?: Identifier;
}

export function _named(value: string, alias?: string): ModuleNamedSpecifier {
  return {
    _kind: NodeKind.MODULE_NAMED_SPECIFIER,
    value: _ref(value),
    alias: alias ? _ref(alias) : undefined,
  };
}

export interface ModuleNamespaceSpecifier extends Node {
  _kind: NodeKind.MODULE_NAMESPACE_SPECIFIER;
  alias?: Identifier;
}

export function _namespace(alias?: string): ModuleNamespaceSpecifier {
  return {
    _kind: NodeKind.MODULE_NAMESPACE_SPECIFIER,
    alias: alias ? _ref(alias) : undefined,
  };
}

export interface ModuleDefaultSpecifier extends Node {
  _kind: NodeKind.MODULE_DEFAULT_SPECIFIER;
  value: Identifier;
}

export function _default(value: string | Identifier): ModuleDefaultSpecifier {
  return {
    _kind: NodeKind.MODULE_DEFAULT_SPECIFIER,
    value: typeof value === "string" ? _ref(value) : value,
  };
}

export type ModuleSpecifier =
  | ModuleNamedSpecifier
  | ModuleNamespaceSpecifier
  | ModuleDefaultSpecifier;

export interface ImportDeclaration extends Node {
  _kind: NodeKind.IMPORT_DECLARATION;
  from: StringLiteral;
  specifiers: ModuleSpecifier[];
}

function _import(from: string, ...specifiers: ModuleSpecifier[]): ImportDeclaration {
  return { _kind: NodeKind.IMPORT_DECLARATION, from: _str(from), specifiers };
}

export interface ExportDeclaration extends Node {
  _kind: NodeKind.EXPORT_DECLARATION;
  specifier: Declaration | TypeDeclaration | InterfaceDeclaration;
}

export function _export(
  specifier: Declaration | TypeDeclaration | InterfaceDeclaration
): ExportDeclaration {
  return { _kind: NodeKind.EXPORT_DECLARATION, specifier };
}

export type ModuleDeclaration = ImportDeclaration | ExportDeclaration;

export const module = {
  import: _import,
  named: _named,
  namespace: _namespace,
  default: _default,
  export: _export,
};

// #endregion Module

export type CodeDeclaration =
  | ModuleDeclaration
  | Declaration
  | TypeDeclaration
  | InterfaceDeclaration;

export interface DocumentDefinition extends Node {
  _kind: NodeKind.CODE_DOCUMENT;
  body: CodeDeclaration[];
}

export function _doc(...body: CodeDeclaration[]): DocumentDefinition {
  return {
    _kind: NodeKind.CODE_DOCUMENT,
    body,
  };
}

export type ASTNode =
  | ArrayDefinition
  | ArrowFunctionExpression
  | AssignmentExpression
  | BinaryExpression
  | BlockStatement
  | BooleanLiteral
  | BreakStatement
  | CallExpression
  | ConditionalExpression
  | DocumentDefinition
  | ElseStatement
  | EmptyStatement
  | ExportDeclaration
  | ForInStatement
  | ForOfStatement
  | FunctionDeclaration
  | Identifier
  | IfStatement
  | ImportDeclaration
  | LogicalExpression
  | MemberExpression
  | ModuleDefaultSpecifier
  | ModuleNamedSpecifier
  | ModuleNamespaceSpecifier
  | NullLiteral
  | NumberLiteral
  | ObjectDefinition
  | Property
  | RestElement
  | ReturnStatement
  | SpreadElement
  | StringLiteral
  | SwitchCase
  | SwitchStatement
  | TemplateLiteral
  | UnaryExpression
  | UndefinedLiteral
  | VariableDeclaration
  | TypeIdentifier
  | TypeBinaryExpression
  | TypeProperty
  | TypeDeclaration
  | InterfaceDeclaration
  | TypeExtendsExpression
  | TypeExpression
  | TypeTupleExpression;

export function isNode(object: unknown): object is ASTNode {
  if (object == null) return false;
  if (typeof object !== "object") return false;
  if (Array.isArray(object)) return object.some((child) => isNode(child));
  return (
    "_kind" in object &&
    typeof object._kind === "string" &&
    Object.values(NodeKind).includes(object._kind as NodeKind)
  );
}

export const tc = {
  ...literal,
  ...types,
  ...definition,
  ...expression,
  ...statement,
  ...declaration,
  ...module,
  doc: _doc,
};
