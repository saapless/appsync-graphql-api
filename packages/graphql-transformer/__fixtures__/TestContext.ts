import { TransformerContext, TransformerContextConfig } from "../src/context";

interface TestingTransformerConfig extends TransformerContextConfig {
  allowPrint?: boolean;
}

export class TestContext extends TransformerContext {
  public allowPrint: boolean;
  public files: Map<string, string> = new Map();

  constructor(config: TestingTransformerConfig) {
    super(config);
    this.allowPrint = config.allowPrint ?? false;
    this.files = new Map();
  }

  public override createOutputDirectory(path: string) {
    return path;
  }

  public printFile(filePath: string, content: string) {
    if (this.allowPrint) {
      return super.printFile(filePath, content);
    }

    this.files.set(filePath, content);
  }

  public printScript(filePath: string, content: string) {
    if (this.allowPrint) {
      return super.printScript(filePath, content);
    }

    this.files.set(filePath, content);
  }
}
