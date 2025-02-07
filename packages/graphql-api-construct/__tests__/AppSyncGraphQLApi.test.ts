import { jest } from "@jest/globals";
import { Template } from "aws-cdk-lib/assertions";
import { App, Stack, StackProps } from "aws-cdk-lib/core";
import { AppSyncGraphQLApi } from "../src/construct/AppSyncGraphQLApi";
import { GraphQLDefinition } from "../src/utils/definition";

function createTemplate() {
  class TestStack extends Stack {
    constructor(scope: App, id: string, props: StackProps) {
      super(scope, id, props);
      new AppSyncGraphQLApi(this, "AppSyncGraphQLApi", {
        name: "AppSyncGraphQLApi",
        definition: GraphQLDefinition.fromString(/* GraphQL */ `
          type User @model {
            id: ID!
            name: String
            todos: Todo @hasMany
          }

          type Todo @model {
            id: ID!
            title: String
          }
        `),
      });
    }
  }

  return Template.fromStack(
    new TestStack(new App({ outdir: "cdk.out" }), "test-stack", {
      env: {
        account: "mock-account",
        region: "us-east-1",
      },
    })
  );
}

describe("AppSyncGraphQLApi construct", () => {
  let template: Template;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    template = createTemplate();
  });

  it("creates appsync api", () => {
    template.resourceCountIs("AWS::AppSync::GraphQLApi", 1);
  });

  it("creates resolvers", () => {
    template.resourceCountIs("AWS::AppSync::Resolver", 11);
  });

  it("creates dataSources", () => {
    template.hasResourceProperties("AWS::AppSync::DataSource", {
      Type: "NONE",
      Name: "NoneDataSource",
    });
    template.hasResourceProperties("AWS::AppSync::DataSource", {
      Type: "AMAZON_DYNAMODB",
      Name: "StoreDataSource",
    });
  });
});
