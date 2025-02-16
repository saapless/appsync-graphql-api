import { DefinitionNode } from "../parser";

export type ReadOperation = "get" | "list" | "sync" | "subscribe";
export type WriteOperation = "create" | "update" | "delete" | "upsert";

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

export type Key<T extends string | number = string | number> = Record<
  string,
  KeyValue<T> & KeyOperator<T>
>;

export type FieldLoaderDescriptor = {
  typeName: string;
  fieldName: string;
  dataSource: string;
  pipeline?: string[];
  action: WriteOperation | ReadOperation;
  key: Key;
  target: DefinitionNode;
  relation?: RelationType;
  index?: string;
  auth?: AuthorizationRule[];
  returnType?: string;
};
