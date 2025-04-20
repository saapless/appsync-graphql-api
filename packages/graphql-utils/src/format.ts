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
  items: T extends ConnectionType<infer I> ? I[] : never;
  prevToken?: string | null;
  nextToken?: string | null;
} & Record<string, unknown>;

export function formatConnection<T extends ConnectionType>(props: ConnectionProps<T>): T {
  const { items, prevToken, nextToken, ...rest } = props;

  const edges = items.filter(Boolean).map((item) => ({
    cursor: btoa(item.id),
    node: item,
  }));

  const pageInfo = {
    hasNextPage: Boolean(nextToken),
    hasPreviousPage: Boolean(prevToken),
    endCursor: nextToken || null,
    startCursor: prevToken || null,
  };

  return { edges, pageInfo, ...rest } as T;
}

export function formatEdges<T extends Node>(items: Array<T | null | undefined>): EdgeType<T>[] {
  const filtered = items.filter(Boolean) as T[];
  return filtered.map((item) => ({
    cursor: btoa(item?.id),
    node: item,
  }));
}

export function formatEdge<T extends Node>(item: T): EdgeType<T> {
  return {
    cursor: btoa(item.id),
    node: item,
  };
}
