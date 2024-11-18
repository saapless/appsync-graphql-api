import { GraphQLError } from "graphql";

export class InvalidDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDefinitionError";
  }
}

export class TransformExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransformExecutionError";
  }
}

export class TransformPluginExecutionError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = `${name}ExecutionError`;
  }
}

export class SchemaValidationError extends Error {
  constructor(errors: Readonly<GraphQLError[]>) {
    super(`Schema validation failed.\n\n${errors.map((error) => error.toString()).join("\n\n")}`);
    this.name = "SchemaValidationError";
  }
}
