import { AuthorizationRule } from "../utils";

export type OperationActionType =
  | "get"
  | "query"
  | "create"
  | "update"
  | "upsert"
  | "delete"
  | "batchGet";

export type ReturnType = "connection" | "edges" | "edge" | "result";

export type IndexType = "sourceId" | "targetId" | "typename";

export type KeyValue<T extends string | number = string> = {
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

export type Key<T extends string | number = string> = KeyValue<T> & KeyOperator<T>;

export type DescriptorOperation = {
  type: OperationActionType;
  key: KeyValue | [pk: KeyValue, sk: Key];
  index?: IndexType;
};

export type ResolverDescriptor = {
  typeName: string;
  fieldName: string;
  operation: DescriptorOperation;
  targetName: string;
  returnType: ReturnType;
  authRules?: AuthorizationRule[];
  isEdge?: boolean;
  checkEarlyReturn?: boolean;
};

export class ResolverLoader {
  private readonly _loaders: Map<string, ResolverDescriptor>;

  constructor() {
    this._loaders = new Map();
  }

  public hasLoader(typeName: string, fieldName: string) {
    return this._loaders.has(`${typeName}.${fieldName}`);
  }

  public getLoader(typeName: string, fieldName: string) {
    return this._loaders.get(`${typeName}.${fieldName}`);
  }

  public setLoader(typeName: string, fieldName: string, loader: Partial<ResolverDescriptor>) {
    const key = `${typeName}.${fieldName}`;
    const existingLoader = this._loaders.get(key);

    if (existingLoader) {
      this._loaders.set(key, { ...existingLoader, ...loader });
    } else {
      this._loaders.set(key, { ...loader, typeName, fieldName } as ResolverDescriptor);
    }
  }

  public getAllLoaders() {
    return Array.from(this._loaders.values());
  }
}
