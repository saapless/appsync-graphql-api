import path from "node:path";
import fg from "fast-glob";

export type ResolverConfig = {
  name: string;
  source?: string;
  code?: string;
};

export class Resolver {
  private readonly config: ResolverConfig;

  constructor(config: ResolverConfig) {
    this.config = config;
  }

  public getConfig() {
    return this.config;
  }

  public static fromSource(source: string | string[]): Resolver[] {
    const paths = fg.globSync(source);

    const resolvers = paths.map((file) => {
      const name = path.basename(file, path.extname(file));
      return new Resolver({ name, source: file });
    });

    return resolvers;
  }

  public static create(config: ResolverConfig): Resolver {
    return new Resolver(config);
  }
}
