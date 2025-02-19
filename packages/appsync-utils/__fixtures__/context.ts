import { Context } from "@aws-appsync/utils";

export const TEST_CONTEXT = {
  args: {},
  arguments: {},
  env: {},
  identity: undefined,
  stash: {},
  info: {
    fieldName: "getPost",
    parentTypeName: "Query",
    variables: {},
    selectionSetList: [],
    selectionSetGraphQL: "",
  },
  request: {
    domainName: "",
    headers: [],
  },
  result: undefined,
  prev: undefined,
  source: undefined,
  error: undefined,
} satisfies Context;
