import { DynamoDbGenerator, NoneGenerator, ResolverGeneratorBase } from "../generators";
import { TransformExecutionError } from "../utils/errors";
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

  public getDataSourceGenerator(dataSourceName: string): ResolverGeneratorBase {
    const dataSource = this.getDataSource(dataSourceName);

    switch (dataSource.type) {
      case "DYNAMO_DB":
        return new DynamoDbGenerator(this._context);
      case "NONE":
        return new NoneGenerator(this._context);
      default:
        throw new TransformExecutionError(
          `Generator not implemented for data source type: ${dataSource}`
        );
    }
  }
}
