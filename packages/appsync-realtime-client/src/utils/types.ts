export enum MessageType {
  ConnectionInit = "connection_init",
  ConnectionAck = "connection_ack",
  KeepAlive = "ka",
  Start = "start",
  StartAck = "start_ack",
  Data = "data",
  Error = "error",
  Stop = "stop",
  Complete = "complete",
}

export type GraphQLError = {
  errorType: string;
  message: string;
};

export type OperationPayload = {
  data: string;
  extensions: {
    authorization: Record<string, unknown>;
  };
};

export type GraphQLResponse = {
  data?: Record<string, unknown>;
  errors?: GraphQLError[];
};

type OperationHandlerArgs =
  | [errors: GraphQLError[], result: null]
  | [errors: null, result: GraphQLResponse];

export type Operation = {
  ack?: boolean;
  payload: OperationPayload;
  handler: (...args: OperationHandlerArgs) => void;
};

export type Observer<T> = {
  next: (value: T) => void;
  error: (error: Error) => void;
  complete: () => void;
};

export type ObserverLike<T> = Partial<Observer<T>>;

export type Observable<T> = {
  subscribe: (observer: ObserverLike<T>) => {
    unsubscribe: () => void;
  };
};

export type ConnectionInitMessage = {
  type: MessageType.ConnectionInit;
};

export type ConnectionAckMessage = {
  type: MessageType.ConnectionAck;
  payload: {
    connectionTimeoutMs: number;
  };
};

export type KeepAliveMessage = {
  type: MessageType.KeepAlive;
};

export type StartMessage = {
  type: MessageType.Start;
  payload: OperationPayload;
};

export type StartAckMessage = {
  type: MessageType.StartAck;
  id: string;
};

export type ErrorMessage = {
  type: MessageType.Error;
  id: string;
  payload: {
    errors: GraphQLError[];
  };
};

export type DataMessage = {
  type: MessageType.Data;
  id: string;
  payload: GraphQLResponse;
};

export type StopMessage = {
  type: MessageType.Stop;
  id: string;
};

export type CompleteMessage = {
  type: MessageType.Complete;
  id: string;
};

export type Message =
  | ConnectionInitMessage
  | ConnectionAckMessage
  | KeepAliveMessage
  | StartMessage
  | StartAckMessage
  | ErrorMessage
  | DataMessage
  | StopMessage
  | CompleteMessage;
