export type ReadOperation = "get" | "list" | "sync" | "subscribe";
export type WriteOperation = "create" | "update" | "delete" | "upsert";
export type EdgeOperation = "createEdge" | "deleteEdge";

export type Operation = "read" | "write" | ReadOperation | WriteOperation;

export type AuthorizationAllowStrategy = "public" | "owner";

export type AuthorizationProvider = "iam" | "oidc" | "userPools" | "lambda";

export type RelationType = "oneToOne" | "oneToMany" | "manyToMany";

export type AuthorizationClaim = {
  key?: string;
  ref?: string;
  eq?: string;
  in?: string[];
  and?: AuthorizationClaim[];
  or?: AuthorizationClaim[];
  not?: AuthorizationClaim[];
};

export type AuthorizationRule = {
  allow?: AuthorizationAllowStrategy;
  operations?: Operation[];
  provider?: AuthorizationProvider;
  claim?: AuthorizationClaim;
};

export type KeyValue<T extends string | number> = {
  ref?: string;
  eq?: T;
};

export type KeyOperator<T extends string | number> = {
  le?: KeyValue<T>;
  lt?: KeyValue<T>;
  ge?: KeyValue<T>;
  gt?: KeyValue<T>;
  between?: KeyValue<T>[];
  beginsWith?: KeyValue<T>;
};

export type Key<T extends string | number = string> = Record<string, KeyValue<T> & KeyOperator<T>>;

export type LoaderActionType =
  | "getItem"
  | "queryItems"
  | "putItem"
  | "updateItem"
  | "upsertItem"
  | "removeItem"
  | "batchGetItems";

export type LoaderReturnType = "connection" | "edges" | "node" | "prev" | "result";

export type LoaderAction = {
  type: LoaderActionType;
  key: Key;
  index?: string;
};

export type LoaderDescriptor = {
  dataSource: string;
  targetName: string;
  action: LoaderAction;
  isEdge?: boolean;
  checkEarlyReturn?: boolean;
  authRules?: AuthorizationRule[];
  returnTargetName?: string;
  returnType?: LoaderReturnType;
};

export type FieldLoaderDescriptor = LoaderDescriptor & {
  typeName: string;
  fieldName: string;
  pipeline?: string[];
};

export type PipelineFunctionLoaderDescriptor = LoaderDescriptor & {
  name: string;
};
