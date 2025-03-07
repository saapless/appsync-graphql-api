import {
  Environment,
  FetchFunction,
  GraphQLResponse,
  Network,
  RecordSource,
  Store,
} from "relay-runtime";

const fetcher: FetchFunction = async () => {
  return {
    data: null,
  } as GraphQLResponse;
};

const environment = new Environment({
  network: Network.create(fetcher),
  store: new Store(new RecordSource()),
});

export { environment };
