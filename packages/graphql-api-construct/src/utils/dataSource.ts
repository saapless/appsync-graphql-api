import { AwsIamConfig } from "aws-cdk-lib/aws-appsync";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IEventBus } from "aws-cdk-lib/aws-events";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { IServerlessCluster } from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

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

export type DataSourceOptions =
  | NoneDataSourceOptions
  | DynamoDBDataSourceOptions
  | HttpDataSourceOptions
  | RdsDataSourceOptions
  | OpenSearchDataSourceOptions
  | EventBridgeDataSourceOptions
  | LambdaDataSourceOptions
  | BedrockDataSourceOptions;

export interface DataSourceConfig {
  primaryDataSource?: DynamoDBDataSourceOptions;
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
