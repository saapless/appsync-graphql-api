import {
  type Context,
  type DynamoDBProjectionExpression,
} from "@aws-appsync/utils";
import type * as Schema from "./schema-types";
export type Key = {
  id: string;
};
export type DynamoDBQueryResult<T extends Key = Key> = {
  items: T[];
  nextToken: string | null;
  scannedCount: number;
};
export type TrasactionCancellationReason = {
  type: string;
  message: string;
};
export type DynamoDBBatchResult<T extends Key = Key> = {
  data: {
    [K: string]: (T | null)[];
  };
  unprocessedKeys: {
    [K: string]: Key[];
  };
};
export type DynamoDBBatchGetItemRequest<T extends Key = Key> = {
  operation: "BatchGetItem";
  tables: {
    [K: string]: {
      keys: T[];
      consistentRead?: boolean;
      projection?: DynamoDBProjectionExpression;
    };
  };
};
export type DynamoDBTransactGetResult<T extends Key = Key> =
  | {
      items: T[];
      cancellationReasons: null;
    }
  | {
      items: null;
      cancellationReasons: TrasactionCancellationReason[];
    };
export type DynamoDBTransactWriteResult =
  | {
      keys: Key[];
      cancellationReasons: null;
    }
  | {
      keys: null;
      cancellationReasons: TrasactionCancellationReason[];
    };
export type QueryMeReqContext = Context<
  Record<string, unknown>,
  Record<string, unknown>,
  undefined,
  undefined,
  undefined
>;
export type QueryMeResContext = Context<
  Record<string, unknown>,
  Record<string, unknown>,
  undefined,
  undefined,
  Schema.User
>;
export type MutationCreateUserReqContext = Context<
  Schema.MutationCreateUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  undefined
>;
export type MutationCreateUserResContext = Context<
  Schema.MutationCreateUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  Schema.User
>;
export type MutationUpdateUserReqContext = Context<
  Schema.MutationUpdateUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  undefined
>;
export type MutationUpdateUserResContext = Context<
  Schema.MutationUpdateUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  Schema.User
>;
export type MutationDeleteUserReqContext = Context<
  Schema.MutationDeleteUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  undefined
>;
export type MutationDeleteUserResContext = Context<
  Schema.MutationDeleteUserArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  Schema.User
>;
