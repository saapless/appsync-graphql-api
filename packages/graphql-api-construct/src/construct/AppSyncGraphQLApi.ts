import path from "node:path";
import { App } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  createTransformer,
  FieldResolverOutput,
  PipelineFunctionOutput,
} from "@saapless/graphql-transformer";
import {
  AttributeType,
  Billing,
  StreamViewType,
  TableV2,
  type ITable,
} from "aws-cdk-lib/aws-dynamodb";
import {
  AuthorizationConfig,
  BaseDataSource,
  Code,
  Definition,
  DomainOptions,
  FunctionRuntime,
  GraphqlApi,
  IAppsyncFunction,
  Resolver,
  IGraphqlApi,
  IntrospectionConfig,
  LogConfig,
  Visibility,
} from "aws-cdk-lib/aws-appsync";
import {
  DataSourceConfig,
  DEFAULT_DATA_SOURCE_NAME,
  GraphQLDefinition,
  GraphQLSchema,
} from "../utils";

export type AppSyncGraphQLApiProps = {
  /**
   * Name of the AppSync GraphQL API
   */
  readonly name: string;
  /**
   * GraphQL Schema definition
   */
  readonly definition: GraphQLDefinition;
  /**
   * API Authorization Configuration _(optional)_
   * @default - API Key authorization
   */
  readonly authorizationConfig?: AuthorizationConfig;
  /**
   * Data Source configuration _(optional)_
   * @default - DynamoDB DataSource
   */
  readonly dataSourceConfig?: DataSourceConfig;
  /**
   * Custom defined field resolvers _(optional)_
   */
  readonly customResolvers?: Resolver[];
  /**
   * Custom defined pipeline functions _(optional)_
   */
  readonly customPipelineFunctions?: Resolver[];
  /**
   * Dev resources output directory, relative to `process.cwd()`
   */
  readonly outDir?: string;
  /**
   * Optional AppSync API configuration _(optional)_
   */
  readonly apiConfig?: {
    readonly xrayEnabled?: boolean;
    readonly logConfig?: LogConfig;
    readonly introspectionConfig?: IntrospectionConfig;
    readonly queryDepthLimit?: number;
    readonly resolverCountLimit?: number;
    readonly ownerContact?: string;
    readonly domainName?: DomainOptions;
    readonly visibility?: Visibility;
    readonly env?: Record<string, string>;
  };
};

export class AppSyncGraphQLApi extends Construct {
  readonly api: IGraphqlApi;
  readonly table?: ITable;

  constructor(scope: Construct, id: string, props: AppSyncGraphQLApiProps) {
    super(scope, id);
    const { name, definition, dataSourceConfig, apiConfig = {} } = props;

    const outputDirectory = path.resolve(
      process.cwd(),
      App.of(this)?.assetOutdir ?? "cdk.out",
      ".appsync"
    );

    const transformer = createTransformer({
      definition: definition.toString(),
      outDir: outputDirectory,
      // fieldResolvers: resolvers?.map((resolver) => resolver.getConfig()),
      // pipelineFunctions: pipelineFunctions?.map((resolver) => resolver.getConfig()),
    });

    const result = transformer.transform();

    this.api = new GraphqlApi(this, "AppSyncGraphQLApi", {
      name: name,
      definition: Definition.fromSchema(GraphQLSchema.fromString(result.schema)),
      ...apiConfig,
    });

    const dataSourcesMap = this._createDataSources(dataSourceConfig);
    const pipelineFunctionsMap = this._createPipelineFunctions(
      result.pipelineFunctions,
      dataSourcesMap
    );

    this._createFieldResolvers(result.fieldResolvers, dataSourcesMap, pipelineFunctionsMap);
  }

  private _createDataSources(config?: DataSourceConfig): Map<string, BaseDataSource> {
    const stash = new Map<string, BaseDataSource>();

    const defaultDsName = config?.defaultDataSource?.name ?? DEFAULT_DATA_SOURCE_NAME;
    const defaultDsTable = config?.defaultDataSource?.table ?? this._createDefaultDataSource();

    const defaultDataSource = this.api.addDynamoDbDataSource(defaultDsName, defaultDsTable, {
      name: defaultDsName,
      description: "Default DynamoDB Data Source",
    });

    stash.set(defaultDsName, defaultDataSource);

    let hasNoneDs = false;

    if (config?.additionalDataSources) {
      for (const ds of config.additionalDataSources) {
        if (ds.type === "NONE") {
          hasNoneDs = true;
        }

        let dataSource;

        switch (ds.type) {
          case "DynamoDB":
            dataSource = this.api.addDynamoDbDataSource(ds.name, ds.table, {
              name: ds.name,
            });
            break;
          case "NONE":
            dataSource = this.api.addNoneDataSource(ds.name, {
              name: ds.name,
            });
            break;
          case "HTTP":
            dataSource = this.api.addHttpDataSource(ds.name, ds.endpoint, {
              name: ds.name,
              authorizationConfig: ds.authorizationConfig,
            });
            break;
          case "Lambda":
            dataSource = this.api.addLambdaDataSource(ds.name, ds.lambdaFunction, {
              name: ds.name,
            });
            break;
          case "EventBridge":
            dataSource = this.api.addEventBridgeDataSource(ds.name, ds.eventBus, {
              name: ds.name,
            });
            break;
          case "OpenSearch":
            dataSource = this.api.addOpenSearchDataSource(ds.name, ds.domain, {
              name: ds.name,
            });
            break;
          case "RDS":
            dataSource = this.api.addRdsDataSource(
              ds.name,
              ds.cluster,
              ds.secret,
              ds.databaseName,
              {
                name: ds.name,
              }
            );
            break;
        }

        stash.set(ds.name, dataSource);
      }
    }

    if (!hasNoneDs) {
      const noneDataSource = this.api.addNoneDataSource("NoneDataSource", {
        name: "NoneDataSource",
      });

      stash.set("NoneDataSource", noneDataSource);
    }

    return stash;
  }

  private _createPipelineFunctions(
    configs: PipelineFunctionOutput[],
    dataSources: Map<string, BaseDataSource>
  ) {
    const stash = new Map<string, IAppsyncFunction>();

    for (const func of configs) {
      const dataSource = func.dataSource
        ? dataSources.get(func.dataSource)
        : dataSources.get(DEFAULT_DATA_SOURCE_NAME);

      if (!dataSource) {
        throw new Error(`Data source ${func.dataSource} not found`);
      }

      const appsyncFunction = dataSource.createFunction(`${func.name}Function`, {
        name: func.name,
        code: Code.fromInline(func.code),
        runtime: FunctionRuntime.JS_1_0_0,
      });

      stash.set(func.name, appsyncFunction);
    }

    return stash;
  }

  private _createFieldResolvers(
    configs: FieldResolverOutput[],
    dataSources: Map<string, BaseDataSource>,
    pipelineFunctions: Map<string, IAppsyncFunction>
  ) {
    const stash = new Map<string, Resolver>();

    for (const config of configs) {
      const dataSource = config.dataSource
        ? dataSources.get(config.dataSource)
        : dataSources.get(DEFAULT_DATA_SOURCE_NAME);

      if (!dataSource) {
        throw new Error(`Data source ${config.dataSource} not found`);
      }

      let pipelineConfig: IAppsyncFunction[] | undefined = undefined;

      if (config.pipelineFunctions?.length) {
        pipelineConfig = config.pipelineFunctions.map((func) => {
          const pipelineFunction = pipelineFunctions.get(func);

          if (!pipelineFunction) {
            throw new Error(`Pipeline function ${func} not found`);
          }

          return pipelineFunction;
        });
      }

      const resolver = this.api.createResolver(`${config.typeName}${config.fieldName}Resolver`, {
        dataSource: pipelineConfig?.length ? undefined : dataSource,
        typeName: config.typeName,
        fieldName: config.fieldName,
        pipelineConfig: pipelineConfig,
        code: Code.fromInline(config.code),
        runtime: FunctionRuntime.JS_1_0_0,
      });

      stash.set(`${config.typeName}.${config.fieldName}`, resolver);
    }

    return stash;
  }

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
