import { Context, NONERequest, util } from "@aws-appsync/utils";

export function request(ctx: Context): NONERequest {
  if (!ctx.source) {
    util.error("Unknown field source", "UnknwonSourceExeption");
  }

  return {
    payload: ctx.args.module,
  };
}

export function response(ctx: Context): string {
  return ctx.result;
}
