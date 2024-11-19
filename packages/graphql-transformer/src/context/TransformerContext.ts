import { DocumentNode } from "../parser";
import { ResolverBase } from "../resolver";

interface TransformerContextConfig {
  document: DocumentNode;
}

export class TransformerContext {
  document: DocumentNode;
  resolvers: Map<string, ResolverBase> = new Map();

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
  }
}
