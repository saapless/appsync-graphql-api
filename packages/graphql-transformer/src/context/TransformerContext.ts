import { DocumentNode } from "../parser";
import { ResolverBase } from "../resolver";

interface TransformerContextConfig {
  document: DocumentNode;
}

export class TransformerContext {
  public readonly document: DocumentNode;
  public readonly resolvers: Map<string, ResolverBase> = new Map();

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
  }
}
