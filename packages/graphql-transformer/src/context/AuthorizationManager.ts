import { AuthorizationRule, ReadOperation, WriteOperation } from "../utils/types";
import { ContextManagerBase } from "./ContextManagerBase";
import { TransformerContext } from "./TransformerContext";

type AuthorizationMode = "API_KEY" | "USER_POOL" | "IAM" | "OIDC" | "LAMBDA";

export interface AuthorizationManagerConfig {
  additionalauthorizationModes?: AuthorizationMode[];
  defaultAuthorizationMode?: AuthorizationMode;
  defaultAuthorizationRules?: AuthorizationRule[];
}

export class AuthorizationManager extends ContextManagerBase {
  private readonly _defaultAuthorizationMode: AuthorizationMode;
  private readonly _additionalAuthorizationModes: AuthorizationMode[];
  private readonly _defaultAuthorizationRules: AuthorizationRule[];
  private readonly _modelAuthRules: Map<string, AuthorizationRule[]> = new Map();

  constructor(context: TransformerContext, config: AuthorizationManagerConfig) {
    super(context);

    this._defaultAuthorizationMode = config.defaultAuthorizationMode = "API_KEY";
    this._defaultAuthorizationRules = config.defaultAuthorizationRules ?? [];
    this._additionalAuthorizationModes = config.additionalauthorizationModes ?? [];
    this._modelAuthRules = new Map();
  }

  get defaultAuthRules() {
    return this._defaultAuthorizationRules;
  }

  public setModelRules(model: string, rules: AuthorizationRule[]) {
    this._modelAuthRules.set(model, rules);
  }

  public getAuthRules(
    operation: ReadOperation | WriteOperation,
    targetType: string,
    definedRules?: AuthorizationRule[]
  ) {
    if (definedRules) {
      return definedRules;
    }

    const modelRules = this._modelAuthRules.get(targetType) ?? this._defaultAuthorizationRules;

    const operationRules = modelRules.filter(
      (rule) => !rule.operations || rule.operations.includes(operation)
    );

    return operationRules;
  }
}
