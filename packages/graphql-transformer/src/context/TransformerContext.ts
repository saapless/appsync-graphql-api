import { DocumentNode } from "../parser";
import { Resolver } from "../resolver";

interface TransformerContextConfig {
  document: DocumentNode;
}

export class TransformerContext {
  document: DocumentNode;
  resolvers: Map<string, Resolver> = new Map();

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
  }
}
