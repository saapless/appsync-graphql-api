import { get } from "@aws-appsync/utils/dynamodb";
import { util, Context } from "@aws-appsync/utils";

export function request(ctx: Context) {
  return get({ key: { id: ctx.args.id } });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return ctx.result;
}
