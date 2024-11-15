import { NodeKind, CodeASTNode } from "./language";
import { block, expression, join, statement, wrap } from "./utils";

type ExtractNodeKeys<T extends CodeASTNode, K = keyof T> = K extends keyof T
  ? Exclude<T[K], undefined> extends CodeASTNode | CodeASTNode[]
    ? K
    : never
  : never;

type PrintedNode<T extends NodeKind, N = Extract<CodeASTNode, { kind: T }>> = {
  [K in keyof N]: N extends CodeASTNode
    ? K extends ExtractNodeKeys<N>
      ? N[K] extends CodeASTNode[]
        ? string[]
        : N[K] extends CodeASTNode[] | undefined
          ? string[] | undefined
          : N[K] extends CodeASTNode
            ? string
            : N[K] extends CodeASTNode | undefined
              ? string | undefined
              : N[K]
      : N[K]
    : never;
};

type NodeReducer<T extends NodeKind, N = Extract<CodeASTNode, { kind: T }>> = N extends CodeASTNode
  ? {
      keys?: ExtractNodeKeys<N>[];
      print: (node: PrintedNode<T>) => string;
    }
  : never;

export type ASTPrintReducer<T extends NodeKind = NodeKind> = {
  [K in T]?: NodeReducer<K>;
};

const printReducer: ASTPrintReducer = {
  CodeDocument: {
    keys: ["imports", "requestFunction", "responseFunction"],
    print(node) {
      const { imports, requestFunction, responseFunction } = node;
      return join("\n", imports ?? "", requestFunction ?? "", responseFunction ?? "");
    },
  },
  ImportStatement: {
    keys: ["default", "named"],
    print: (node) => {
      const defaultImport = node.default ? `${node.default}` : "";
      const namedImports = node.named ? wrap("{ ", join(", ", node.named), " }") : "";
      return statement(`import ${join(", ", defaultImport, namedImports)} from "${node.from}"`);
    },
  },
  ImportValue: {
    print: (node) => {
      const type = node.type ? "type" : "";
      const alias = node.alias ? `as ${node.alias}` : "";
      return join(" ", type, node.value, alias);
    },
  },
  FunctionDefinition: {
    keys: ["parameters"],
    print: (node) =>
      statement(
        join(
          " ",
          node.exports ? "export" : "",
          "function",
          join("", node.name, expression(join(", ", node.parameters))),
          block(node.body)
        )
      ),
  },
  FunctionParameter: {
    print: (node) => join(" = ", join(": ", node.name, node.type ?? ""), node.default ?? ""),
  },
};

export function printAST<T extends CodeASTNode>(
  node: T,
  reducer: ASTPrintReducer = printReducer
): string {
  const reducerEntry = reducer[node.kind] as NodeReducer<T["kind"]>;

  if (!reducerEntry) {
    return "";
  }

  const { keys, print } = reducerEntry;

  // Traverse child keys and replace them with their string representations

  const printed = { ...node } as PrintedNode<T["kind"]>;

  if (keys?.length) {
    for (const key of keys) {
      if (Object.hasOwn(node, key)) {
        const value = node[key as ExtractNodeKeys<T>] as CodeASTNode | CodeASTNode[];

        if (Array.isArray(value)) {
          Object.assign(printed, {
            [key]: value.map((child) => (child ? printAST(child, reducer) : "")),
          });
        } else if (value !== undefined) {
          Object.assign(printed, { [key]: printAST(value, reducer) });
        }
      }
    }
  }

  return print(printed);
}
