import { ITable } from "aws-cdk-lib/aws-dynamodb";

export type DataSourceType =
  | "NONE"
  | "DynamoDB"
  | "HTTP"
  | "RDS"
  | "OpenSearch"
  | "Bedrock"
  | "EventBridge"
  | "Lambda";

export class DataSource {
  public static createDynamoDB(name: string, table: ITable) {
    return {
      name: name,
      type: "DynamoDB",
      table: table,
    };
  }
}
