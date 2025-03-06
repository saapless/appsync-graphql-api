import { Construct } from "constructs";
import {
  AuthorizationConfig,
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
import { createTransformer, TransformerOutput } from "@saapless/graphql-transformer";
import { Operation } from "@saapless/graphql-transformer/utils";
import { GraphQLDefinition, GraphQLSchema } from "../utils";
import { DataSourceProvider, DataSourceConfig } from "./DataSourceProvider";

type FieldResolverOutput = {
  typeName: string;
  fieldName: string;
  pipelineFunctions?: string[];
  dataSource: string;
  code: string;
};

type PipelineFunctionOutput = {
  name: string;
  dataSource: string;
  code: string;
};

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
  readonly transformerConfig?: {
    /**
     * Development resources output directory, relative to `process.cwd()`
     */
    readonly outDir?: string;
    /**
     * Custom defined resolvers _(optional)_
     * * Relative to `process.pwd()`
     * * Can contain blob patterns
     */
    readonly customResolversSource?: string | string[];
    /**
     * Default operations for wich the transformer will create mutation or query fields;
     * @default CRUDL
     * * Query: `get`, `list`;
     * * Mutation: `create`, `update`, 'delete'
     */
    readonly defaultModelOperations?: Operation[];
  };
};

export class AppSyncGraphQLApi extends Construct {
  readonly api: IGraphqlApi;

  private readonly _dataSources: DataSourceProvider;
  private readonly _pipelineFunction: Map<string, IAppsyncFunction> = new Map();
  private readonly _fieldResolvers: Map<string, Resolver> = new Map();

  constructor(scope: Construct, id: string, props: AppSyncGraphQLApiProps) {
    super(scope, id);
    const { name, definition, dataSourceConfig, apiConfig = {}, transformerConfig = {} } = props;

    this._dataSources = new DataSourceProvider(this, "DataSourceProvider", dataSourceConfig);

    const transformer = createTransformer({
      ...transformerConfig,
      definition: definition.toString(),
    });

    const {
      schema,
      fieldResolvers = [],
      pipelineFunctions = [],
    } = transformer.transform() as TransformerOutput<{
      fieldResolvers: [];
      pipelineFunctions: [];
    }>;

    this.api = new GraphqlApi(this, "GraphQLApi", {
      name: name,
      definition: Definition.fromSchema(GraphQLSchema.fromString(schema)),
      ...apiConfig,
    });

    this._dataSources.provide(this.api);

    this._createPipelineFunctions(pipelineFunctions);
    this._createFieldResolvers(fieldResolvers);
  }

  private _getDataSource(name: string) {
    const dataSource = this._dataSources.getDataSource(name);

    if (!dataSource) {
      throw new Error(`Data source ${name} not found`);
    }
    return dataSource;
  }

  private _createPipelineFunctions(configs: PipelineFunctionOutput[]) {
    for (const func of configs) {
      const dataSource = this._getDataSource(func.dataSource);

      const appsyncFunction = dataSource.createFunction(`${func.name}Function`, {
        name: func.name,
        code: Code.fromInline(func.code),
        runtime: FunctionRuntime.JS_1_0_0,
      });

      this._pipelineFunction.set(func.name, appsyncFunction);
    }
  }

  private _createFieldResolvers(configs: FieldResolverOutput[]) {
    const stash = new Map<string, Resolver>();

    for (const config of configs) {
      const dataSource = this._getDataSource(config.dataSource);

      let pipelineConfig: IAppsyncFunction[] = [];

      if (config.pipelineFunctions?.length) {
        pipelineConfig = config.pipelineFunctions.map((func) => {
          const pipelineFunction = this._pipelineFunction.get(func);

          if (!pipelineFunction) {
            throw new Error(`Pipeline function ${func} not found`);
          }

          return pipelineFunction;
        });
      }

      const resolver = this.api.createResolver(`${config.typeName}${config.fieldName}Resolver`, {
        dataSource: pipelineConfig.length ? undefined : dataSource,
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
}
