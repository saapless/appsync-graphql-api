import { DocumentNode } from "../definition";
import { ResolverManager, ResolverManagerConfig } from "../resolver/ResolverManager";
import { AuthorizationManagerConfig, AuthorizationManager } from "./AuthorizationManager";
import { DataSourceManager, DataSourceManagerConfig } from "./DataSourceManager";
import { OperationsManager, OperationsManagerConfig } from "./OperationsManager";
import { ResolverLoader } from "./ResolverLoader";

export interface TransformerContextConfig extends ResolverManagerConfig {
  document: DocumentNode;
  dataSourceConfig: DataSourceManagerConfig;
  authorizationConfig?: AuthorizationManagerConfig;
  modelOperationsConfig?: OperationsManagerConfig;
}

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly resolvers: ResolverManager;
  public readonly loader: ResolverLoader;
  public readonly auth: AuthorizationManager;
  public readonly dataSources: DataSourceManager;
  public readonly operations: OperationsManager;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.dataSources = new DataSourceManager(this, config.dataSourceConfig);
    this.operations = new OperationsManager(this, config.modelOperationsConfig);
    this.auth = new AuthorizationManager(this, config.authorizationConfig ?? {});
    this.resolvers = new ResolverManager(this, config);
    this.loader = new ResolverLoader();
  }
}
