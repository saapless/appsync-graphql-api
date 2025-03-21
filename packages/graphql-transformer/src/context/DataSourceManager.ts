import { TransformExecutionError } from "../utils/errors";
import { ContextManagerBase } from "./ContextManagerBase";
import { TransformerContext } from "./TransformerContext";

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

export class DataSourceManager extends ContextManagerBase {
  private readonly _primaryDataSourceName: string;
  private readonly _dataSources: Map<string, DataSourceConfig>;

  constructor(context: TransformerContext, config: DataSourceManagerConfig) {
    super(context);

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

  public get noneDataSourceName(): string {
    const noneDataSource = Array.from(this._dataSources.entries()).find(
      (ds) => ds[1].type === "NONE"
    );

    if (!noneDataSource) {
      throw new TransformExecutionError("No `NONE` dataSource configured");
    }

    return noneDataSource[0];
  }

  public getDataSource(name: string) {
    const dataSource = this._dataSources.get(name);

    if (!dataSource) {
      throw new TransformExecutionError(`Missing dataSource ${name}`);
    }

    return dataSource;
  }
}
