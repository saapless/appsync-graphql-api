import { CodeDocument } from "../codegen";
import { DynamoDbGenerator } from "../generators";
import { TransformExecutionError } from "../utils/errors";
import { TransformerContext } from "./TransformerContext";

export type DataSourceType =
  | "DYNAMO_DB"
  | "HTTP"
  | "RDS"
  | "AWS_LAMBDA"
  | "EVENT_BRIDGE"
  | "AWS_BEDROCK"
  | "NONE"
  | "OPEN_SEARCH";

export type NoneDataSorce = {
  type: "NONE";
};

export type DynamoDBDataSource = {
  type: "DYNAMO_DB";
  config: {
    tableName: string;
  };
};

export type DataSourceConfig = NoneDataSorce | DynamoDBDataSource;

export interface DataSourceManagerConfig {
  primaryDataSourceName: string;
  dataSources: Record<string, DataSourceConfig>;
}

export class DataSourceManager {
  private readonly _primaryDataSourceName: string;
  private readonly _dataSources: Map<string, DataSourceConfig>;
  private readonly _context: TransformerContext;

  constructor(context: TransformerContext, config: DataSourceManagerConfig) {
    this._context = context;
    this._primaryDataSourceName = config.primaryDataSourceName;
    this._dataSources = new Map(Object.entries(config.dataSources));

    this._validatePrimaryDataSourceConfig();
  }

  private _validatePrimaryDataSourceConfig() {
    const primaryDataSource = this._dataSources.get(this._primaryDataSourceName);

    if (!primaryDataSource || primaryDataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError(
        "`defaultDataSourceName` needs to be configured as a `DYNAMO_DB` dataSource"
      );
    }
  }

  public get primaryDataSourceName(): string {
    return this._primaryDataSourceName;
  }

  public getDataSource(name: string) {
    const dataSource = this._dataSources.get(name);

    if (!dataSource) {
      throw new TransformExecutionError(`Missing dataSource ${name}`);
    }

    return dataSource;
  }

  public getDataSourceGenerator(dataSourceName: string, code: CodeDocument) {
    const dataSource = this.getDataSource(dataSourceName);

    switch (dataSource.type) {
      case "DYNAMO_DB":
        return new DynamoDbGenerator(this._context, code);
      default:
        throw new TransformExecutionError(
          `Generator not implemented for data source type: ${dataSource.type}`
        );
    }
  }
}
