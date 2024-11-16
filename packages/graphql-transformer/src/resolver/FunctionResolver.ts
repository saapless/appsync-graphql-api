import { Resolver, ResolverKind } from "./ResolverBase";

export class FunctionResolver extends Resolver {
  public readonly kind = ResolverKind.FUNCTION_RESOLVER;
  public readonly name: string;

  constructor(name: string, dataSource?: string, source?: string) {
    super(name, dataSource, source);
    this.name = name;
  }

  public serialize() {
    return {
      name: this.name,
      dataSource: this.dataSource,
      source: this.print(),
    };
  }

  static fromSource(name: string, source: string, dataSource?: string) {
    return new FunctionResolver(name, dataSource, source);
  }

  static create(name: string, dataSource?: string) {
    return new FunctionResolver(name, dataSource);
  }
}
