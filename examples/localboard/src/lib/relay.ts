import { graphql } from "graphql";
import {
  Environment,
  FetchFunction,
  GraphQLResponse,
  Network,
  RecordSource,
  Store,
} from "relay-runtime";
import { schema } from "../../__generated__/executable-schema";
import db from "./dexie";

const fetcher: FetchFunction = async (request, variables) => {
  const result = await graphql({
    schema,
    source: request.text!,
    variableValues: variables,
    operationName: request.name,
    contextValue: { db: db.records },
  });

  if (result.errors) {
    console.error(result);
  }

  return result as GraphQLResponse;
};

const environment = new Environment({
  network: Network.create(fetcher),
  store: new Store(new RecordSource()),
});

export { environment, type Environment };
