import { camelCase } from "../../src/utils/strings";

describe("string utils", () => {
  describe("camelCase util", () => {
    it("should handle snake_case strings", () => {
      expect(camelCase("user_name")).toBe("userName");
      expect(camelCase("first_name_last_name")).toBe("firstNameLastName");
      expect(camelCase("aws_api_gateway")).toBe("awsApiGateway");
      expect(camelCase("_private_field")).toBe("privateField");
    });

    it("should handle kebab-case strings", () => {
      expect(camelCase("user-profile")).toBe("userProfile");
      expect(camelCase("aws-lambda-function")).toBe("awsLambdaFunction");
      expect(camelCase("graphql-schema")).toBe("graphqlSchema");
      expect(camelCase("-prefix-value")).toBe("prefixValue");
    });

    it("should handle PascalCase strings", () => {
      expect(camelCase("UserProfile")).toBe("userProfile");
      expect(camelCase("GraphQLSchema")).toBe("graphQlSchema");
      expect(camelCase("AWSAppSync")).toBe("awsAppSync");
      expect(camelCase("HTTPResponse")).toBe("httpResponse");
    });

    it("should handle mixed format strings", () => {
      expect(camelCase("User_profile-type")).toBe("userProfileType");
      expect(camelCase("AWS-lambda_FUNCTION")).toBe("awsLambdaFunction");
      expect(camelCase("graphQL_Api-endpoint")).toBe("graphQlApiEndpoint");
      expect(camelCase("REST_api-Gateway")).toBe("restApiGateway");
    });

    it("should handle multiple string inputs", () => {
      expect(camelCase("user", "profile", "data")).toBe("userProfileData");
      expect(camelCase("aws", "lambda", "function")).toBe("awsLambdaFunction");
      expect(camelCase("graphql", "schema", "type")).toBe("graphqlSchemaType");
      expect(camelCase("api_gateway", "rest-endpoint")).toBe("apiGatewayRestEndpoint");
    });

    it("should handle edge cases", () => {
      expect(camelCase("")).toBe("");
      expect(camelCase("   ")).toBe("");
      expect(camelCase("a")).toBe("a");
      expect(camelCase("Z")).toBe("z");
      expect(camelCase("123_test")).toBe("123Test");
      expect(camelCase("TEST_VALUE")).toBe("testValue");
    });
  });
});
