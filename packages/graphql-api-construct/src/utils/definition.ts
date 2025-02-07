import { readFileSync } from "node:fs";
import { IGraphqlApi, ISchema, ISchemaConfig } from "aws-cdk-lib/aws-appsync";
import fg from "fast-glob";

export class GraphQLSchema implements ISchema {
  public readonly definition: string;

  constructor(definition: string) {
    this.definition = definition;
  }

  bind(api: IGraphqlApi): ISchemaConfig {
    return {
      apiId: api.apiId,
      definition: this.definition,
    };
  }

  static fromString(definition: string): GraphQLSchema {
    return new GraphQLSchema(definition);
  }
}

export class GraphQLDefinition {
  public readonly definition: string;

  constructor(definition: string) {
    this.definition = definition;
  }

  public toString(): string {
    return this.definition;
  }

  public static fromString(definition: string): GraphQLDefinition {
    return new GraphQLDefinition(definition);
  }

  public static fromSource(source: string | string[]): GraphQLDefinition {
    if (!Array.isArray(source)) {
      source = [source];
    }

    const paths = fg.globSync(source, {
      absolute: true,
    });

    if (paths.length === 0) {
      throw new Error(`No schema definition found at ${source}`);
    }

    let definition: string = "";

    for (const path of paths) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      definition += readFileSync(path, { encoding: "utf-8" });
    }

    return new GraphQLDefinition(definition);
  }
}
