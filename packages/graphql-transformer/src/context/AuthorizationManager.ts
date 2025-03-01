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

  public setModelReuls(model: string, rules: AuthorizationRule[]) {
    this._modelAuthRules.set(model, rules);
  }

  public getAuthRules(
    operation: ReadOperation | WriteOperation,
    targetType: string,
    definedRules?: AuthorizationRule[]
  ) {
    // TODO: Implement logic to get authorization rules based on the operation and defined rules
    // 1. Defined rules take priority over all other ones
    // 2. If no defined rules are present, check for object level rules based on operation;
    // 3. If no object rules defined, return default rule based on operation;

    if (definedRules) {
      return definedRules;
    }

    if (
      operation === "get" ||
      operation === "list" ||
      operation === "sync" ||
      operation === "subscribe"
    ) {
      return this._defaultAuthorizationRules;
    } else if (
      operation === "create" ||
      operation === "update" ||
      operation === "delete" ||
      operation === "upsert"
    ) {
      return this._defaultAuthorizationRules;
    } else {
      return this._defaultAuthorizationRules;
    }
  }
}
