import { TransformExecutionError } from "../utils/errors";
import { Block, CodeDocument, tc } from "./code";

export enum ResolverKind {
  FIELD_RESOLVER = "FieldResolver",
  FUNCTION_RESOLVER = "FunctionResolver",
}

/**
 * In order to allow plugins to handle a different aspect in the execution process of a resolver
 * we heed a way organize and identify the declarations.
 *
 * The execution process is divided into 4 stages:
 * 1. `Initiate` - tipically used in the entrypoint resolver
 *     like `Query.node` or `Mutation.createCode` to setup the context and default values
 * 2. `Authorize` - check request authorization based on context or set up condition rules
 * 3. `Load` - used by all resolver, defines the dataSource request.
 * 4. `Return` - tipically used in the `response` resolver to check and format
 *     the dataSource result.
 */

export enum StageKind {
  INIT = "Initiate",
  AUTH = "Authorize",
  LOAD = "Load",
  RETURN = "Return",
}

export abstract class ResolverBase {
  abstract readonly kind: ResolverKind;

  public readonly isReadonly: boolean = false;
  public readonly dataSource?: string;

  private readonly _name: string;
  private readonly stages: Map<StageKind, Block[]>;
  private readonly _code: CodeDocument;
  private readonly _source?: string;

  constructor(name: string, dataSource?: string, source?: string) {
    this._name = name;
    this.dataSource = dataSource;
    this.stages = new Map();
    this._code = CodeDocument.create();

    if (source) {
      this._source = source;
      this.isReadonly = true;
    }
  }

  private _throwReadonly() {
    return new TransformExecutionError(
      `Resolver ${this._name} is readonly and most likely was created from source. You cannot mutate a resolver source.`
    );
  }

  private _buildTemplate() {
    const request: Block[] = [];

    const initStage = this.stages.get(StageKind.INIT);
    const authStage = this.stages.get(StageKind.AUTH);
    const loadStage = this.stages.get(StageKind.LOAD);
    let returnStage = this.stages.get(StageKind.RETURN);

    // TODO: Need to rethink this as it makes it hard to test resolvers in isolation.

    // if (!loadStage) {
    //   throw new TransformExecutionError(
    //     `Resolver ${this._name}: Could not build resolver, missing LOAD stage`
    //   );
    // }

    if (initStage) request.push(...initStage);
    if (authStage) request.push(...authStage);
    if (loadStage) request.push(...loadStage);

    this._code.addRequestFunction(...request);

    if (!returnStage) {
      returnStage = [
        tc.const(tc.obj(tc.ref("error"), tc.ref("result")), tc.ref("ctx")),
        tc.if(
          tc.ref("error"),
          tc.call(tc.ref("util.error"), [tc.ref("error.message"), tc.ref("erorr.type")])
        ),
        tc.return(tc.ref("result")),
      ];
    }

    this._code.addResponseFunction(...returnStage);

    return this._code;
  }

  public addImport(from: string, value: string, alias?: string) {
    if (this.isReadonly) {
      throw this._throwReadonly();
    }

    this._code.addImport(from, tc.named(value, alias));
    return this;
  }

  public hasStage(kind: keyof typeof StageKind) {
    return this.stages.has(StageKind[`${kind}`]);
  }

  public setStage(kind: keyof typeof StageKind, ...statements: Block[]) {
    if (this.isReadonly || !this._code) {
      throw this._throwReadonly();
    }

    if (this.hasStage(kind)) {
      throw new TransformExecutionError(`Stage ${kind} already exists`);
    }

    this.stages.set(StageKind[`${kind}`], statements);
    return this;
  }

  public print(): string {
    if (this.isReadonly) {
      return this._source ?? "";
    }

    const build = this._buildTemplate();
    return build.print();
  }
}
