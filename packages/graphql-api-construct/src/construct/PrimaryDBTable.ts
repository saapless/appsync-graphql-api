import { AttributeType, Billing, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface PrimaryDBTableProps {
  tableName?: string;
}

export class PrimaryDBTable extends TableV2 {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billing: Billing.onDemand(),
      timeToLiveAttribute: "_ttl",
      // dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES,
      globalSecondaryIndexes: [
        {
          indexName: "byTypename",
          partitionKey: { name: "__typename", type: AttributeType.STRING },
          sortKey: { name: "_sk", type: AttributeType.STRING },
        },
        {
          indexName: "bySourceId",
          partitionKey: { name: "sourceId", type: AttributeType.STRING },
          sortKey: { name: "_sk", type: AttributeType.STRING },
        },
        {
          indexName: "byTargetId",
          partitionKey: { name: "targetId", type: AttributeType.STRING },
          sortKey: { name: "_sk", type: AttributeType.STRING },
        },
      ],
    });
  }
}
