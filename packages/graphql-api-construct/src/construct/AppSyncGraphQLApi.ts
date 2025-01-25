import { Construct } from "constructs";
import { Definition, GraphqlApi, IGraphqlApi } from "aws-cdk-lib/aws-appsync";
import { createTransformer } from "@saapless/graphql-transformer";
import { readFilesFromSource } from "../utils/readFilesFromSource";
import { GraphQLSchema } from "../utils/definition";

export type AppSyncGraphQLApiProps = {
  readonly name: string;
  readonly definition: string | string[];
  readonly authorizationConfig: {
    default: string;
    additional: {
      [key: string]: string;
    };
  };
  readonly xrayEnabled: boolean;
};

export class AppSyncGraphQLApi extends Construct {
  readonly api: IGraphqlApi;
  constructor(scope: Construct, id: string, props: AppSyncGraphQLApiProps) {
    super(scope, id);

    const transformer = createTransformer({ definition: readFilesFromSource(props.definition) });

    const result = transformer.transform();

    this.api = new GraphqlApi(this, "AppSyncGraphQLApi", {
      name: props.name,
      definition: Definition.fromSchema(GraphQLSchema.fromString(result.schema)),
      xrayEnabled: props.xrayEnabled,
    });
  }
}
