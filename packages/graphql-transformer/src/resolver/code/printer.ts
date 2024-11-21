import { NodeKind, ASTNode, isNode } from "./ast";

// #region Types

type ExtractNodeKeys<T extends ASTNode, K = keyof T> = K extends keyof T
  ? Exclude<T[K], undefined> extends ASTNode | ASTNode[]
    ? K
    : never
  : never;

type PrintedNode<T extends NodeKind, N = Extract<ASTNode, { _kind: T }>> = N extends ASTNode
  ? {
      [K in keyof N]: K extends ExtractNodeKeys<N>
        ? N[K] extends ASTNode[]
          ? string[]
          : N[K] extends ASTNode[] | undefined
            ? string[] | undefined
            : N[K] extends ASTNode
              ? string
              : N[K] extends ASTNode | undefined
                ? string | undefined
                : N[K]
        : N[K];
    }
  : never;

type PrintContext = {
  parent?: ASTNode;
  siblings?: ASTNode[];
  index?: number;
};

export type ASTPrintReducer<T extends NodeKind = NodeKind> = {
  [K in T]?: (node: PrintedNode<K>, context: PrintContext) => string;
};

// #endregion Types

// #region Printer
const printReducer: ASTPrintReducer = {
  Array: (node) => wrap("[", join(", ", node.elements), "]"),
  ArrowFunctionExpression: (node) =>
    join(" => ", wrap("(", join(", ", node.parameters), ")"), node.body),
  AssignmentExpression: (node) => join(` ${node.operator} `, node.left, node.right),
  BinaryExpression: (node) => join(` ${node.operator} `, node.left, node.right),
  BlockStatement: (node) => block(...node.body),
  BreakStatement: () => statement("break"),
  CallExpression: (node) =>
    join("", node.callee, node.optional ? "?." : "", wrap("(", join(", ", node.arguments), ")")),
  CodeDocument: (node) => join("\n", ...node.body),
  ConditionalExpression: (node) => join(" ", node.test, "?", node.consequent, ":", node.alternate),
  EmptyStatement: () => "\n",
  ForInStatement: (node) =>
    join(" ", "for", wrap("(", join(" ", node.left, "in", node.right)), node.body),
  ForOfStatement: (node) =>
    join(" ", "for", wrap("(", join(" ", node.left, "of", node.right)), node.body),
  FunctionDeclaration: (node) =>
    join(
      " ",
      "function",
      join("", node.name, wrap("(", join(", ", node.parameters), ")")),
      node.body
    ),
  Identifier: (node) => node.name,
  IfStatement: (node) =>
    join(
      " ",
      "if",
      expression(node.condition),
      node.alternate ? node.consequent.trimEnd() : node.consequent,
      node.alternate ? join(" ", "else", node.alternate) : ""
    ),
  ImportDeclaration: (node) => join(" ", "import", "from", node.from),
  Literal: (node) => node.value,
  LogicalExpression: (node) => join(` ${node.operator} `, node.left, node.right),
  MemberExpression: (node) => join(node.optional ? "?." : ".", node.object, node.property),
  ModuleDefaultSpecifier: (node) => node.value,
  ModuleNamedSpecifier: (node) => join(" as ", node.value, node.alias),
  ModuleNamespaceSpecifier: (node) => join(" as ", "*", node.alias),
  Object: (node) => wrap("{ ", join(", ", node.properties), " }"),
  Property: (node) => join(": ", node.name, node.value),
  RestElement: (node) => wrap("...", node.argument),
  ReturnStatement: (node) => wrap("return ", node.value),
  SpreadElement: (node) => wrap("...", node.argument),
  SwitchCase: (node) => join("case ", node.test, ":", ...node.consequent),
  SwitchStatement: (node) => join("switch ", node.discriminant, block(...node.cases)),
  UnaryExpression: (node) => join(node.operator, node.argument),
  VariableDeclaration: (node) => wrap(node.type, join(" = ", node.name, node.value)),
};

export function printAST<T extends ASTNode>(
  node: T,
  reducer: ASTPrintReducer = printReducer,
  context?: PrintContext
): string {
  const print = reducer[node._kind] as ASTPrintReducer[T["_kind"]];

  if (!print) return "";
  const ctx: PrintContext = context ?? {};

  const printed = { ...node } as PrintedNode<T["_kind"]>;
  // Traverse child keys and replace them with their string representations
  for (const [key, value] of Object.entries(node)) {
    if (isNode(value)) {
      if (Array.isArray(value)) {
        Object.assign(printed, {
          [key]: value.map((child, index) =>
            child ? printAST(child, reducer, { parent: node, siblings: value, index }) : ""
          ),
        });
      } else if (value !== undefined) {
        Object.assign(printed, { [key]: printAST(value, reducer, { parent: node }) });
      }
    }
  }

  return print(printed, ctx);
}

// #endregion Printer

// #region Utils

function wrap(start: string, value: string, end = "") {
  return `${start}${value}${end}`;
}

function indent(value: string) {
  return value
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function join<T extends (string | null | undefined | string[])[]>(
  separator = "",
  ...statements: T
) {
  return statements.flat().filter(Boolean).join(separator);
}

function block<T extends string[]>(...value: T) {
  return wrap("{\n", indent(join("\n", value)).trimEnd(), "\n}\n");
}

function expression(value: string) {
  return wrap("(", value, ")");
}

function statement(value: string) {
  return wrap("", value, `${value.endsWith(";") ? "" : ";"}\n`);
}

// #endregion Utils
