import { DocumentNode } from "../parser";
import { ResolverManager, ResolverManagerConfig } from "../resolver/ResolverManager";
import {
  AuthorizationRule,
  LoaderDescriptor,
  Operation,
  ReadOperation,
  WriteOperation,
} from "../utils/types";

export interface TransformerContextConfig extends ResolverManagerConfig {
  document: DocumentNode;
  defaultAuthorizationRule?: AuthorizationRule;
  readOperations?: ReadOperation[];
  writeOperations?: WriteOperation[];
  defaultModelOperations?: Operation[];
}

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly resolvers: ResolverManager;
  public readonly loaders: Map<string, LoaderDescriptor> = new Map();
  public readonly defaultAuthorizationRule: AuthorizationRule;
  public readonly readOperations: ReadOperation[];
  public readonly writeOperations: WriteOperation[];
  public readonly defaultModelOperations: (ReadOperation | WriteOperation)[];

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.resolvers = new ResolverManager(this, config);
    this.defaultAuthorizationRule = config.defaultAuthorizationRule ?? { allow: "owner" };
    this.readOperations = config.readOperations ?? ["get", "list"];
    this.writeOperations = config.writeOperations ?? ["create", "update", "delete"];
    this.defaultModelOperations = config.defaultModelOperations?.length
      ? this.expandOperations(config.defaultModelOperations)
      : ["create", "update", "delete", "get", "list"];
  }

  public expandOperations(operations: Operation[]): (ReadOperation | WriteOperation)[] {
    const expandedOperations: Set<ReadOperation | WriteOperation> = new Set();

    for (const operation of operations) {
      switch (operation) {
        case "read":
          this.readOperations.forEach((op) => expandedOperations.add(op));
          break;
        case "write":
          this.writeOperations.forEach((op) => expandedOperations.add(op));
          break;
        default:
          expandedOperations.add(operation);
      }
    }

    return Array.from(expandedOperations.values());
  }

  public setLoader(
    typeName: string,
    fieldName: string,
    loader: Omit<Partial<LoaderDescriptor>, "typeName" | "fieldName">
  ) {
    const key = `${typeName}.${fieldName}`;
    const existingLoader = this.loaders.get(key);

    if (existingLoader) {
      this.loaders.set(key, { ...existingLoader, ...loader });
    } else {
      this.loaders.set(key, { ...loader, typeName, fieldName } as LoaderDescriptor);
    }
  }
}
