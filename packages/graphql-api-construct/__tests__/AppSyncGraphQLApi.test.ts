import { describe, jest } from "@jest/globals";
import { Template } from "aws-cdk-lib/assertions";
import { App, Stack, StackProps } from "aws-cdk-lib/core";
import { AppSyncGraphQLApi } from "../src/construct/AppSyncGraphQLApi";

function createTemplate() {
  class TestStack extends Stack {
    constructor(scope: App, id: string, props: StackProps) {
      super(scope, id, props);

      new AppSyncGraphQLApi(this, "AppSyncGraphQLApi", {
        name: "AppSyncGraphQLApi",
        definition: "__tests__/test_schema.graphql",
        xrayEnabled: false,
        authorizationConfig: {
          default: "",
          additional: {},
        },
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
});
