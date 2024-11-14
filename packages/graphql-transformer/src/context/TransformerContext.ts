import { DocumentNode } from "../parser";

interface TransformerContextConfig {
  document: DocumentNode;
}

export class TransformerContext {
  document: DocumentNode;

  constructor(config: TransformerContextConfig) {
    this.document = config.document;
  }
}
