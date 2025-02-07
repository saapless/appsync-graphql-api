import { AwsIamConfig } from "aws-cdk-lib/aws-appsync";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IEventBus } from "aws-cdk-lib/aws-events";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { IServerlessCluster } from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export type DataSourceType =
  | "NONE"
  | "DynamoDB"
  | "HTTP"
  | "RDS"
  | "OpenSearch"
  | "EventBridge"
  | "Lambda";

export interface IDataSourceOptions {
  type: DataSourceType;
  name: string;
}

export interface NoneDataSourceOptions extends IDataSourceOptions {
  type: "NONE";
}

export interface DynamoDBDataSourceOptions extends IDataSourceOptions {
  type: "DynamoDB";
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
  type: "OpenSearch";
  domain: IDomain;
}

export interface EventBridgeDataSourceOptions extends IDataSourceOptions {
  type: "EventBridge";
  eventBus: IEventBus;
}

export interface LambdaDataSourceOptions extends IDataSourceOptions {
  type: "Lambda";
  lambdaFunction: IFunction;
}

export type DataSourceOptions =
  | NoneDataSourceOptions
  | DynamoDBDataSourceOptions
  | HttpDataSourceOptions
  | RdsDataSourceOptions
  | OpenSearchDataSourceOptions
  | EventBridgeDataSourceOptions
  | LambdaDataSourceOptions;

export interface DataSourceConfig {
  defaultDataSource?: DynamoDBDataSourceOptions;
  additionalDataSources?: DataSourceOptions[];
}

export const DEFAULT_DATA_SOURCE_NAME = "StoreDataSource";

export class DataSource {
  public static createDynamoDB(name: string, table: ITable) {
    return {
      name: name,
      type: "DynamoDB",
      table: table,
    };
  }
}
