import { readFileSync } from "node:fs";
import { IGraphqlApi, ISchema, ISchemaConfig } from "aws-cdk-lib/aws-appsync";
import fg from "fast-glob";

export class GraphQLSchema implements ISchema {
  constructor(readonly definition: string) {}

  bind(api: IGraphqlApi): ISchemaConfig {
    return {
      apiId: api.apiId,
      definition: this.definition,
    };
  }

  static fromString(definition: string): GraphQLSchema {
    return new GraphQLSchema(definition);
  }

  static fromSource(source: string | string[]) {
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

    return new GraphQLSchema(definition);
  }
}
