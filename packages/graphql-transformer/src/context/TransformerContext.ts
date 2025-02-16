import { DocumentNode } from "../parser";
import { ResolverManager, ResolverManagerConfig } from "../resolver/ResolverManager";
import { TransformExecutionError } from "../utils/errors";
import {
  AuthorizationRule,
  FieldLoaderDescriptor,
  Operation,
  ReadOperation,
  WriteOperation,
} from "../utils/types";

export type DataSourceType =
  | "DYNAMO_DB"
  | "HTTP"
  | "RDS"
  | "AWS_LAMBDA"
  | "EVENT_BRIDGE"
  | "AWS_BEDROCK"
  | "NONE"
  | "OPEN_SEARCH";

export type DataSourceConfig = {
  readonly type: DataSourceType;
};

export interface TransformerContextConfig extends ResolverManagerConfig {
  document: DocumentNode;
  dataSourceConfig: Record<string, DataSourceConfig>;
  defaultDataSourceName: string;
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
  public readonly fieldLoaders: Map<string, FieldLoaderDescriptor> = new Map();
  public readonly defaultAuthorizationRule: AuthorizationRule;
  public readonly readOperations: ReadOperation[];
  public readonly writeOperations: WriteOperation[];
  public readonly defaultModelOperations: (ReadOperation | WriteOperation)[];
  public readonly dataSourceConfig: Record<string, DataSourceConfig>;
  public readonly defaultDataSourceName: string;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.resolvers = new ResolverManager(this, config);
    this.defaultDataSourceName = config.defaultDataSourceName;
    this.dataSourceConfig = config.dataSourceConfig;
    this.defaultAuthorizationRule = config.defaultAuthorizationRule ?? { allow: "owner" };
    this.readOperations = config.readOperations ?? DEFAULT_READ_OPERATIONS;
    this.writeOperations = config.writeOperations ?? DEFAULT_WRITE_OPERATIONS;
    this.defaultModelOperations = config.defaultModelOperations?.length
      ? this.expandOperations(config.defaultModelOperations)
      : [...DEFAULT_READ_OPERATIONS, ...DEFAULT_WRITE_OPERATIONS];

    this._validateDataSourceConfig();
  }

  private _validateDataSourceConfig() {
    const primaryDataSource = this.dataSourceConfig[this.defaultDataSourceName];
    const noneDataSource = Object.values(this.dataSourceConfig).find((ds) => ds.type === "NONE");

    if (!primaryDataSource || primaryDataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError(
        "`defaultDataSourceName` needs to be configured as a `DYNAMO_DB` dataSource"
      );
    }

    if (!noneDataSource) {
      throw new TransformExecutionError("Missing `NONE` type dataSource config.");
    }
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

  public setFieldLoader(
    typeName: string,
    fieldName: string,
    loader: Partial<FieldLoaderDescriptor>
  ) {
    const key = `${typeName}.${fieldName}`;
    const existingLoader = this.fieldLoaders.get(key);

    if (existingLoader) {
      this.fieldLoaders.set(key, { ...existingLoader, ...loader });
    } else {
      this.fieldLoaders.set(key, { ...loader, typeName, fieldName } as FieldLoaderDescriptor);
    }
  }
}
