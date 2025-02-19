import type {
  AppSyncIdentityCognito,
  AppSyncIdentityIAM,
  AppSyncIdentityLambda,
  AppSyncIdentityOIDC,
  Identity,
} from "@aws-appsync/utils";

type AppSyncIdentityCognitoWithClaims<T extends Record<string, unknown>> = {
  [K in keyof AppSyncIdentityCognito]: K extends "claims" ? T : AppSyncIdentityCognito[K];
};

export function isCognitoIdentity<T extends Record<string, unknown> = Record<string, unknown>>(
  identity: Identity
): identity is AppSyncIdentityCognitoWithClaims<T> {
  return util.authType() === "User Pool Authorization";
}

type AppSyncIdentityLambdaWithClaims<T extends Record<string, unknown>> = {
  [K in keyof AppSyncIdentityLambda]: K extends "resolverContext" ? T : AppSyncIdentityLambda[K];
};

export function isLambdaIdentity<T extends Record<string, unknown> = Record<string, unknown>>(
  identity: Identity
): identity is AppSyncIdentityLambdaWithClaims<T> {
  return !!identity && Object.hasOwn(identity, "resolverContext");
}

type AppSyncIdentityOIDCWithClaims<T extends Record<string, unknown>> = {
  [K in keyof AppSyncIdentityOIDC]: K extends "claims" ? T : AppSyncIdentityOIDC[K];
};

export function isOidcIdentity<T extends Record<string, unknown> = Record<string, unknown>>(
  identity: Identity
): identity is AppSyncIdentityOIDCWithClaims<T> {
  return util.authType() === "Open ID Connect Authorization";
}

export function isIamIdentity(identity: Identity): identity is AppSyncIdentityIAM {
  return util.authType() === "IAM Authorization";
}

export function isApiKeyIdentity(identity: Identity): identity is null {
  return util.authType() === "API Key Authorization";
}
