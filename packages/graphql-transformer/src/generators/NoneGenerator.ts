import { CodeDocument, tc } from "../codegen";
import { TransformerContext } from "../context";
import { TransformExecutionError } from "../utils/errors";
import { LoaderDescriptor } from "../utils/types";
import { ResolverGeneratorBase } from "./ResolverGeneratorBase";

export class NoneGenerator extends ResolverGeneratorBase {
  constructor(context: TransformerContext, code: CodeDocument) {
    super(context, code);
  }

  private _mapQueryToBatchGet() {
    this.code
      .addImport("@aws-appsync/utils", tc.named("DynamoDBBatchGetItemRequest"), tc.named("util"))
      .addImport(
        "../schema-types",
        tc.named("DynamoDBQueryResult"),
        tc.named("PipelinePrevResult"),
        tc.named("Node")
      )
      .addDeclaration(
        tc.typeDef(
          "MapKeysCommand",
          tc.typeObj([
            tc.typeProp("tableName", tc.typeRef("string")),
            tc.typeProp("keyPath", tc.typeRef("keyof Node")),
          ])
        )
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeRef("MapKeysCommand"),
          tc.typeRef("DynamoDBQueryResult", [tc.typeRef("Node")]),
        ]),
        result: tc.typeRef("PipelinePrevResult", [
          tc.typeRef("DynamoDBBatchGetItemRequest"),
          tc.typeRef("DynamoDBQueryResult", [tc.typeRef("Node")]),
        ]),
      })
      .setRequest(
        ...this._getCommand(),
        tc.const("queryResult", tc.ref("ctx.prev.result.results[0]")),
        tc.const(
          "batchGetCommand",
          tc.ref("ctx.prev.result.commands[0] as unknown as DynamoDBBatchGetItemRequest")
        ),
        tc.if(tc.or(tc.not(tc.ref("queryResult")), tc.not(tc.ref("batchGetCommand"))), [
          tc.return(
            tc.call(tc.ref("util.error"), [
              tc.str("Missing required pipeline commands"),
              tc.str("PipelineCommandException"),
            ])
          ),
        ]),
        tc.const(
          "keys",
          tc.call(tc.ref("queryResult.items.map"), [
            tc.arrow(tc.ref("item"), tc.ref("({ id: item[command.keyPath] })")),
          ])
        ),
        tc.assign(
          tc.ref("batchGetCommand.tables[command.tableName]"),
          tc.obj({
            keys: tc.call(tc.ref("keys.filter"), [tc.ref("Boolean")]),
          })
        ),
        tc.return(
          tc.obj({
            payload: tc.ref("ctx.prev.result"),
          })
        )
      )
      .setResponse(
        tc.if(
          tc.ref("ctx.error"),
          tc.call(tc.ref("util.error"), [tc.ref("ctx.error.message"), tc.ref("ctx.error.type")])
        ),
        tc.return(tc.ref("ctx.result"))
      );
  }

  public generateTemplate(loader: LoaderDescriptor) {
    if (!loader.action) {
      throw new TransformExecutionError("`loader.action` is required for DynamoDB resolvers");
    }

    switch (loader.action.type) {
      // case "mapQueryToBatchGet":
      //   this._mapQueryToBatchGet();
      //   break;
      default:
        throw new TransformExecutionError(`Unknown operation ${loader.action.type}`);
    }
    return;
  }
}
