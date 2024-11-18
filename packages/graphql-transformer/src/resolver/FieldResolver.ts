import { Resolver, ResolverKind } from "./ResolverBase";

export class FieldResolver extends Resolver {
  public readonly kind = ResolverKind.FIELD_RESOLVER;
  public readonly typeName: string;
  public readonly fieldName: string;
  public readonly pipelineFunctions?: string[];

  constructor(
    typeName: string,
    fieldName: string,
    dataSource?: string,
    pipelineFunctions?: string[],
    source?: string
  ) {
    super(`${typeName}.${fieldName}`, dataSource, source);

    this.typeName = typeName;
    this.fieldName = fieldName;
    this.pipelineFunctions = pipelineFunctions;
  }

  public serialize() {
    return {
      typeName: this.typeName,
      fieldName: this.fieldName,
      dataSource: this.dataSource,
      pipelineFunctions: this.pipelineFunctions,
      code: this.print(),
    };
  }

  static fromSource(
    typeName: string,
    fieldName: string,
    source: string,
    dataSource?: string,
    pipelineFunctions?: string[]
  ) {
    return new FieldResolver(typeName, fieldName, dataSource, pipelineFunctions, source);
  }

  static create(
    typeName: string,
    fieldName: string,
    dataSource?: string,
    pipelineFunctions?: string[]
  ) {
    return new FieldResolver(typeName, fieldName, dataSource, pipelineFunctions);
  }
}
