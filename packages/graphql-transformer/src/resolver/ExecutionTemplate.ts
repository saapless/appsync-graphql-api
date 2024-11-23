/**
 * @internal
 * not in use
 */

import { Statement } from "./code";

enum StageKind {
  INIT = "Initiate",
  AUTH = "Authorize",
  LOAD = "Load",
  RETURN = "Return",
}

class ExecutionStage {
  public readonly kind: StageKind;
  public readonly statements: Statement[];

  constructor(kind: StageKind, statements: Statement[]) {
    this.kind = kind;
    this.statements = statements;
  }

  public serialize() {
    return {
      kind: this.kind,
      statements: this.statements,
    };
  }

  static create(kind: keyof typeof StageKind, statements: Statement | Statement[] = []) {
    return new ExecutionStage(
      StageKind[`${kind}`],
      Array.isArray(statements) ? statements : [statements]
    );
  }
}

export class ExecutionTemplate {
  public readonly stages: Map<StageKind, ExecutionStage>;
  constructor() {
    this.stages = new Map();
  }

  protected _hasStage(stage: keyof typeof StageKind) {
    return this.stages.has(StageKind[`${stage}`]);
  }

  protected _addStage(stage: keyof typeof StageKind, statements: Statement[]) {
    this.stages.set(StageKind[`${stage}`], ExecutionStage.create(stage, statements));
  }
}
