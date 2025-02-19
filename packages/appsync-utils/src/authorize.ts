import { Context, DynamoDBFilterObject } from "@aws-appsync/utils";

type AuthorizationResult<TIdentity = Record<string, unknown>> = {
  isAuthorized: boolean;
  identityClaims: TIdentity;
  conditions: DynamoDBFilterObject;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function authorize(ctx: Context, rules: unknown): AuthorizationResult {
  return {
    isAuthorized: true,
    identityClaims: {},
    conditions: [],
  };
}
