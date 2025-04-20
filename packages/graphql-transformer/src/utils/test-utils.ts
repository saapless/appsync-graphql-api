import { TransformerContext, TransformerContextConfig } from "../context";

export class TestTransformerContext extends TransformerContext {
  public files: Map<string, string> = new Map();

  constructor(config: TransformerContextConfig) {
    super(config);
    this.files = new Map();
  }

  public override createOutputDirectory(path: string) {
    return path;
  }

  public printFile(filePath: string, content: string) {
    this.files.set(filePath, content);
  }

  public printScript(filePath: string, content: string) {
    this.files.set(filePath, content);
  }
}
