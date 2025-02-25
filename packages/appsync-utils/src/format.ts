export type Node<TIdField extends string = "id"> = Record<TIdField, string>;

export type EdgeType<T extends Node> = {
  cursor?: string | null;
  node?: T | null;
};

export type ConnectionType<T extends Node = Node> = {
  edges: EdgeType<T>[];
  pageInfo: {
    hasPreviousPage?: boolean | null;
    hasNextPage?: boolean | null;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

type ConnectionProps<T extends ConnectionType> = {
  items: T extends ConnectionType
    ? T["edges"] extends Array<EdgeType<infer N>>
      ? N[]
      : unknown[]
    : never;
  prevToken?: string | null;
  nextToken?: string | null;
};

export function formatConnection<T extends ConnectionType>(props: ConnectionProps<T>): T {
  const { items, prevToken, nextToken } = props;

  const edges = items.filter(Boolean).map((item) => ({
    cursor: util.base64Encode(item.id),
    node: item,
  }));

  const pageInfo = {
    hasNextPage: Boolean(nextToken),
    hasPreviousPage: Boolean(prevToken),
    endCursor: nextToken || null,
    startCursor: prevToken || null,
  };

  return { edges, pageInfo } as T;
}

export function formatEdges<T>(items: T extends Array<EdgeType<infer N>> ? (N | null)[] : never) {
  const filtered = items.filter(Boolean) as T extends Array<EdgeType<infer N>> ? N[] : never;
  return filtered.map((item) => ({
    cursor: util.base64Encode(item?.id),
    node: item,
  })) as T;
}

export function formatEdge<T extends Node>(item: T): EdgeType<T> {
  return {
    cursor: util.base64Encode(item.id),
    node: item,
  };
}
