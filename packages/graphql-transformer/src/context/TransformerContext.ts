import { DocumentNode } from "../parser";
import { ResolverManager, ResolverManagerConfig } from "../resolver/ResolverManager";
import { AuthorizationRule, Operation, ReadOperation, WriteOperation } from "../utils/types";
import { DataSourceManager, DataSourceManagerConfig } from "./DataSourceManager";
import { ResolverLoader } from "./ResolverLoader";

export interface TransformerContextConfig extends ResolverManagerConfig {
  document: DocumentNode;
  dataSourceConfig: DataSourceManagerConfig;
  defaultAuthorizationRule?: AuthorizationRule;
  readOperations?: ReadOperation[];
  writeOperations?: WriteOperation[];
  defaultModelOperations?: Operation[];
}

export const DEFAULT_READ_OPERATIONS: ReadOperation[] = ["get", "list"];
export const DEFAULT_WRITE_OPERATIONS: WriteOperation[] = ["create", "update", "delete"];

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly resolvers: ResolverManager;
  public readonly loader: ResolverLoader;
  public readonly defaultAuthorizationRule: AuthorizationRule;
  public readonly readOperations: ReadOperation[];
  public readonly writeOperations: WriteOperation[];
  public readonly defaultModelOperations: (ReadOperation | WriteOperation)[];
  public readonly dataSources: DataSourceManager;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.resolvers = new ResolverManager(this, config);
    this.loader = new ResolverLoader();
    this.dataSources = new DataSourceManager(this, config.dataSourceConfig);
    this.defaultAuthorizationRule = config.defaultAuthorizationRule ?? { allow: "owner" };
    this.readOperations = config.readOperations ?? DEFAULT_READ_OPERATIONS;
    this.writeOperations = config.writeOperations ?? DEFAULT_WRITE_OPERATIONS;
    this.defaultModelOperations = config.defaultModelOperations?.length
      ? this.expandOperations(config.defaultModelOperations)
      : [...DEFAULT_READ_OPERATIONS, ...DEFAULT_WRITE_OPERATIONS];
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
}
