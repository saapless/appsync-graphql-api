export const ModelDirective = Object.freeze({
  MODEL: "model",
});

export const ModelOperation = Object.freeze({
  READ: "read",
  GET: "get",
  LIST: "list",
  SYNC: "sync",
  SUBSCRIBE: "subscribe",
  WRITE: "write",
  CREATE: "create",
  UPDATE: "update",
  UPSERT: "upsert",
  DELETE: "delete",
});

export type ModelOperationType = (typeof ModelOperation)[keyof typeof ModelOperation];
