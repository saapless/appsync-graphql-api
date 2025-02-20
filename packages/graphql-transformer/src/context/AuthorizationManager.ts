import { AuthorizationRule } from "../utils/types";
import { TransformerContext } from "./TransformerContext";

export interface AuthorizationConfig {
  authorizationModes?: unknown[];
  defaultAuthorizationMode?: unknown;
  defaultAuthorizationRules?: AuthorizationRule[];
}

export class AuthorizationManager {
  private readonly _context: TransformerContext;
  private readonly _defaultAuthorizationMode: unknown;
  private readonly _defaultAuthorizationRules: AuthorizationRule[] = [];
  private readonly _authorizationModes: unknown[] = [];

  constructor(context: TransformerContext, config: AuthorizationConfig) {
    this._context = context;
    this._defaultAuthorizationMode = config.defaultAuthorizationMode;
    this._defaultAuthorizationRules = config.defaultAuthorizationRules ?? [];
    this._authorizationModes = config.authorizationModes ?? [];
  }

  get defaultAuthRules() {
    return this._defaultAuthorizationRules;
  }
}
