import path from "node:path";
import {
  AttributeType,
  Billing,
  StreamViewType,
  TableV2,
  type ITable,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import {
  AuthorizationConfig,
  Code,
  Definition,
  DomainOptions,
  FunctionRuntime,
  GraphqlApi,
  IGraphqlApi,
  IntrospectionConfig,
  LogConfig,
  Visibility,
} from "aws-cdk-lib/aws-appsync";
import { App } from "aws-cdk-lib";
import { createTransformer } from "@saapless/graphql-transformer";
import { Resolver, GraphQLDefinition, GraphQLSchema, DataSource } from "../utils";

export type AppSyncGraphQLApiProps = {
  readonly name: string;
  readonly definition: GraphQLDefinition;
  readonly authorizationConfig?: AuthorizationConfig;
  readonly apiConfig?: {
    readonly xrayEnabled?: boolean;
    readonly logConfig?: LogConfig;
    readonly introspectionConfig?: IntrospectionConfig;
    readonly queryDepthLimit?: number;
    readonly resolverCountLimit?: number;
    readonly ownerContact?: string;
    readonly domainName?: DomainOptions;
    readonly visibility?: Visibility;
  };
  readonly env?: Record<string, string>;
  readonly dataSources?: DataSource[];
  readonly resolvers?: Resolver[];
  readonly pipelineFunctions?: Resolver[];
};

export class AppSyncGraphQLApi extends Construct {
  readonly api: IGraphqlApi;
  readonly table?: ITable;

  constructor(scope: Construct, id: string, props: AppSyncGraphQLApiProps) {
    super(scope, id);
    const { name, definition, resolvers, pipelineFunctions, apiConfig = {} } = props;

    const outputDirectory = path.resolve(
      process.cwd(),
      App.of(this)?.assetOutdir ?? "cdk.out",
      ".appsync"
    );

    const defaultDataSource = this._createDefaultDataSource();

    const transformer = createTransformer({
      definition: definition.toString(),
      outputDirectory: outputDirectory,
      fieldResolvers: resolvers?.map((resolver) => resolver.getConfig()),
      pipelineFunctions: pipelineFunctions?.map((resolver) => resolver.getConfig()),
    });

    const result = transformer.transform();

    this.api = new GraphqlApi(this, "AppSyncGraphQLApi", {
      name: name,
      definition: Definition.fromSchema(GraphQLSchema.fromString(result.schema)),
      ...apiConfig,
    });

    const _defaultDS = this.api.addDynamoDbDataSource("StoreDataSource", defaultDataSource);
    this.api.addNoneDataSource("NoneDataSource");

    for (const [name, config] of Object.entries(result.fieldResolvers)) {
      this.api.createResolver(`${name}Resolver`, {
        dataSource: _defaultDS,
        typeName: config.typeName,
        fieldName: config.fieldName,
        // pipelineConfig:
        code: Code.fromInline(config.code),
        runtime: FunctionRuntime.JS_1_0_0,
      });
    }
  }

  private _createDataSources() {}
  private _createPipelineFunctions() {}
  private _createFieldResolvers() {}

  private _createDefaultDataSource() {
    const table = new TableV2(this, "StoreTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billing: Billing.onDemand(),
      timeToLiveAttribute: "_ttl",
      dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES,
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

    return table;
  }
}
