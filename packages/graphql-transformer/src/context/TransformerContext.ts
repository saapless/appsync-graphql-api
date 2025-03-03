import { DocumentNode } from "../definition";
import { AuthorizationManager } from "./AuthorizationManager";
import { OperationsManager, OperationsManagerConfig } from "./OperationsManager";
import { ResolverManager } from "./ResolverManager";

export interface TransformerContextConfig {
  document: DocumentNode;
  modelOperationsConfig?: OperationsManagerConfig;
}

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly operations: OperationsManager;
  public readonly resolvers: ResolverManager;
  public readonly auth: AuthorizationManager;
  public readonly stash: Map<string, unknown>;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.operations = new OperationsManager(this, config.modelOperationsConfig);
    this.resolvers = new ResolverManager(this);
    this.auth = new AuthorizationManager(this, {});
    this.stash = new Map();
  }

  public getOrSetStash<TValue>(key: string, value: TValue): TValue {
    if (!this.stash.has(key)) {
      this.stash.set(key, value);
    }

    return this.stash.get(key) as TValue;
  }
}
