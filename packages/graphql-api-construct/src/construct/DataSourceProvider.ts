import { Construct } from "constructs";
import { AwsIamConfig, BaseDataSource, IGraphqlApi } from "aws-cdk-lib/aws-appsync";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IEventBus } from "aws-cdk-lib/aws-events";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { IServerlessCluster } from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { PrimaryDBTable } from "./PrimaryDBTable";

export type DataSourceType =
  | "DYNAMO_DB"
  | "HTTP"
  | "RDS"
  | "AWS_LAMBDA"
  | "EVENT_BRIDGE"
  | "AWS_BEDROCK"
  | "NONE"
  | "OPEN_SEARCH";

export interface IDataSourceOptions {
  type: DataSourceType;
  name: string;
}

export interface NoneDataSourceOptions extends IDataSourceOptions {
  type: "NONE";
}

export interface DynamoDBDataSourceOptions extends IDataSourceOptions {
  type: "DYNAMO_DB";
  table: ITable;
}

export interface HttpDataSourceOptions extends IDataSourceOptions {
  type: "HTTP";
  endpoint: string;
  authorizationConfig?: AwsIamConfig;
}
export interface RdsDataSourceOptions extends IDataSourceOptions {
  type: "RDS";
  cluster: IServerlessCluster;
  secret: ISecret;
  databaseName?: string;
}

export interface OpenSearchDataSourceOptions extends IDataSourceOptions {
  type: "OPEN_SEARCH";
  domain: IDomain;
}

export interface EventBridgeDataSourceOptions extends IDataSourceOptions {
  type: "EVENT_BRIDGE";
  eventBus: IEventBus;
}

export interface LambdaDataSourceOptions extends IDataSourceOptions {
  type: "AWS_LAMBDA";
  lambdaFunction: IFunction;
}

export interface BedrockDataSourceOptions extends IDataSourceOptions {
  type: "AWS_BEDROCK";
  lambdaFunction: IFunction;
}

export type DataSourceOptions = NoneDataSourceOptions | DynamoDBDataSourceOptions;
// | HttpDataSourceOptions
// | RdsDataSourceOptions
// | OpenSearchDataSourceOptions
// | EventBridgeDataSourceOptions
// | LambdaDataSourceOptions
// | BedrockDataSourceOptions;

export type NoneDataSorce = {
  type: "NONE";
};

export type DynamoDBDataSource = {
  type: "DYNAMO_DB";
  config: {
    tableName: string;
  };
};

export type TransformerDataSourceConfig = NoneDataSorce | DynamoDBDataSource;

export interface DataSourceManagerConfig {
  primaryDataSourceName: string;
  dataSources: Record<string, TransformerDataSourceConfig>;
}

export interface DataSourceConfig {
  primaryDataSource?: DynamoDBDataSourceOptions;
  additionalDataSources?: DataSourceOptions[];
}

export const DEFAULT_DATA_SOURCE_NAME = "PrimaryDataSource";
export const DEFAULT_NODE_DS_NAME = "NoneDataSource";

export class DataSourceProvider extends Construct {
  private readonly _dataSourcesConfig: DataSourceOptions[];
  private readonly _primaryDataSourceName: string;
  private readonly _dataSources: Map<string, BaseDataSource> = new Map();

  constructor(scope: Construct, id: string, props: DataSourceConfig = {}) {
    super(scope, id);

    this._dataSourcesConfig = this._ensureConfig(props);
    this._primaryDataSourceName = props.primaryDataSource?.name ?? DEFAULT_DATA_SOURCE_NAME;
  }

  private _ensureConfig(config: DataSourceConfig) {
    const dataSources: DataSourceOptions[] = config.additionalDataSources ?? [];

    const hasNoneDataSource = dataSources.some((ds) => ds.type === "NONE");

    if (config.primaryDataSource) {
      // Validate primary data source
      dataSources.push(config.primaryDataSource);
    } else {
      dataSources.push({
        name: DEFAULT_DATA_SOURCE_NAME,
        type: "DYNAMO_DB",
        table: new PrimaryDBTable(this, "PrimaryDBTable"),
      });
    }

    if (!hasNoneDataSource) {
      dataSources.push({
        type: "NONE",
        name: DEFAULT_NODE_DS_NAME,
      });
    }

    return dataSources;
  }

  getConfig(): DataSourceManagerConfig {
    const dataSources = this._dataSourcesConfig.reduce(
      (agg, ds) => {
        if (ds.type === "DYNAMO_DB") {
          agg[ds.name] = {
            type: ds.type,
            config: {
              tableName: ds.table.tableName,
            },
          };
        } else {
          agg[ds.name] = {
            type: ds.type,
          };
        }

        return agg;
      },
      {} as Record<string, TransformerDataSourceConfig>
    );
    return {
      primaryDataSourceName: this._primaryDataSourceName,
      dataSources: dataSources,
    };
  }

  public provide(api: IGraphqlApi) {
    for (const ds of this._dataSourcesConfig) {
      switch (ds.type) {
        case "DYNAMO_DB":
          this._dataSources.set(
            ds.name,
            api.addDynamoDbDataSource(ds.name, ds.table, {
              name: ds.name,
            })
          );
          break;
        case "NONE":
          this._dataSources.set(
            ds.name,
            api.addNoneDataSource(ds.name, {
              name: ds.name,
            })
          );
          break;
        // case "HTTP":
        //   api.addHttpDataSource(ds.name, ds.endpoint, {
        //     name: ds.name,
        //     authorizationConfig: ds.authorizationConfig,
        //   });
        //   break;
        // case "RDS":
        //   api.addRdsDataSource(ds.name, ds.cluster, ds.secret, ds.databaseName, {
        //     name: ds.name,
        //   });
        //   break;
        // case "AWS_LAMBDA":
        //   api.addLambdaDataSource(ds.name, ds.lambdaFunction, {
        //     name: ds.name,
        //   });
        //   break;
        // case "EVENT_BRIDGE":
        //   api.addEventBridgeDataSource(ds.name, ds.eventBus, {
        //     name: ds.name,
        //   });
        //   break;
        // case "OPEN_SEARCH":
        //   api.addOpenSearchDataSource(ds.name, ds.domain, {
        //     name: ds.name,
        //   });
        // break;
      }
    }
  }

  getDataSource(name: string): BaseDataSource {
    const dataSource = this._dataSources.get(name);
    if (!dataSource) {
      throw new Error(`Data source ${name} not found`);
    }

    return dataSource;
  }
}
