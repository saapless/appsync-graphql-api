export enum PhaseKind {
  REQUEST = "Request",
  AUTH = "Auth",
  RESPONSE = "Response",
}

export enum StageKind {
  INITIATE = "Initiate",
  EVALUATE = "Evaluate",
  EXECUTE = "Execute",
}

export class ExecutionPhase {
  public readonly kind: PhaseKind;
  public readonly stages: Map<StageKind, PhaseStage>;

  constructor(kind: PhaseKind) {
    this.kind = kind;
    this.stages = new Map();
  }

  public addStage(stage: PhaseStage) {
    this.stages.set(stage.kind, stage);
    return this;
  }

  public hasStage(stage: keyof typeof StageKind) {
    return this.stages.has(StageKind[`${stage}`]);
  }

  public getStage(stage: keyof typeof StageKind) {
    return this.stages.get(StageKind[`${stage}`]);
  }

  public serialize() {
    return {
      kind: this.kind,
      stages: Array.from(this.stages.entries()).reduce(
        (agg, [kind, stage]) => {
          agg[`${kind}`] = stage.serialize();
          return agg;
        },
        {} as Record<StageKind, { kind: StageKind; statements: string[] }>
      ),
    };
  }

  static create(kind: keyof typeof PhaseKind) {
    return new ExecutionPhase(PhaseKind[`${kind}`]);
  }
}

export class PhaseStage {
  public readonly kind: StageKind;
  public readonly statements: string[];

  constructor(kind: StageKind, statements: string[]) {
    this.kind = kind;
    this.statements = statements;
  }

  public serialize() {
    return {
      kind: this.kind,
      statements: this.statements,
    };
  }

  static create(kind: keyof typeof StageKind, statements: string | string[] = []) {
    return new PhaseStage(
      StageKind[`${kind}`],
      typeof statements === "string" ? [statements] : statements
    );
  }
}

export class ExecutionTemplate {
  public readonly phases: Map<PhaseKind, ExecutionPhase>;
  constructor() {
    this.phases = new Map();
  }

  addStage(phase: keyof typeof PhaseKind, stage: PhaseStage) {
    let phaseObject = this.phases.get(PhaseKind[`${phase}`]);

    if (!phaseObject) {
      phaseObject = ExecutionPhase.create(phase);
      this.phases.set(PhaseKind[`${phase}`], phaseObject);
    }

    return phaseObject.addStage(stage);
  }
}
