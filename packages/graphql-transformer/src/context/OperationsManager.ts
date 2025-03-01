import { Operation, ReadOperation, WriteOperation } from "../utils";
import { ContextManagerBase } from "./ContextManagerBase";
import { TransformerContext } from "./TransformerContext";

export interface OperationsManagerConfig {
  readOperations?: ReadOperation[];
  writeOperations?: WriteOperation[];
  defaultModelOperations?: Operation[];
}

export const DEFAULT_READ_OPERATIONS: ReadOperation[] = ["get", "list"];
export const DEFAULT_WRITE_OPERATIONS: WriteOperation[] = ["create", "update", "delete"];

export class OperationsManager extends ContextManagerBase {
  private readonly _readOperations: ReadOperation[];
  private readonly _writeOperations: WriteOperation[];
  private readonly _defaultModelOperations: (ReadOperation | WriteOperation)[];

  constructor(context: TransformerContext, config: OperationsManagerConfig = {}) {
    super(context);

    this._readOperations = config.readOperations ?? DEFAULT_READ_OPERATIONS;
    this._writeOperations = config.writeOperations ?? DEFAULT_WRITE_OPERATIONS;
    this._defaultModelOperations = this._expandOperations(config.defaultModelOperations);
  }

  private _expandOperations(operations?: Operation[]): (ReadOperation | WriteOperation)[] {
    if (!operations) {
      return [...DEFAULT_READ_OPERATIONS, ...DEFAULT_WRITE_OPERATIONS];
    }

    const expandedOperations: Set<ReadOperation | WriteOperation> = new Set();

    for (const operation of operations) {
      switch (operation) {
        case "read":
          this._readOperations.forEach((op) => expandedOperations.add(op));
          break;
        case "write":
          this._writeOperations.forEach((op) => expandedOperations.add(op));
          break;
        default:
          expandedOperations.add(operation);
      }
    }

    return Array.from(expandedOperations.values());
  }

  public getModelOperations(args?: Operation[]) {
    if (args?.length) {
      return this._expandOperations(args);
    }

    return this._defaultModelOperations;
  }
}
