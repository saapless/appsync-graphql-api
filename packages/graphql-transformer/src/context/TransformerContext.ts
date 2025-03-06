import path from "node:path";
import { DocumentNode } from "../definition";
import { ensureOutputDirectory, prettyPrintFile, printFile } from "../utils";
import { AuthorizationManager } from "./AuthorizationManager";
import { OperationsManager, OperationsManagerConfig } from "./OperationsManager";
import { ResolverLoader } from "./ResolverLoader";

export interface TransformerContextConfig {
  document: DocumentNode;
  outputDirectory: string;
  modelOperationsConfig?: OperationsManagerConfig;
}

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly outputDirectory: string;
  public readonly operations: OperationsManager;
  public readonly resolvers: ResolverLoader;
  public readonly auth: AuthorizationManager;
  public readonly stash: Map<string, unknown>;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
    this.outputDirectory = this.createOutputDirectory(config.outputDirectory);
    this.operations = new OperationsManager(this, config.modelOperationsConfig);
    this.resolvers = new ResolverLoader();
    this.auth = new AuthorizationManager(this, {});
    this.stash = new Map();
  }

  public createOutputDirectory(path: string) {
    return ensureOutputDirectory(path);
  }

  public getOrSetStash<TValue>(key: string, value: TValue): TValue {
    if (!this.stash.has(key)) {
      this.stash.set(key, value);
    }

    return this.stash.get(key) as TValue;
  }

  public printFile(filePath: string, content: string) {
    return printFile(path.resolve(this.outputDirectory, filePath), content);
  }

  public printScript(filePath: string, content: string) {
    return prettyPrintFile(path.resolve(this.outputDirectory, filePath), content);
  }
}
