import type { AuthorizationRule, LoaderDescriptor } from "../utils/types";
import { TransformerContext } from "../context";
import { CodeDocument, tc } from "../codegen";
import { TransformExecutionError } from "../utils/errors";
import { formatValue, isFieldLoader, parseKey } from "./utils";
import { ContextTypesGenerator } from "./ContextTypesGenerator";

export class DynamoDbGenerator extends ContextTypesGenerator {
  constructor(context: TransformerContext, code: CodeDocument) {
    super(context, code);
  }

  // #region Context Types
  private _setQueryItemsCtx(descriptor: LoaderDescriptor) {
    this.code
      .addImport(
        "../schema-types",
        tc.named("DynamoDBQueryResult"),
        tc.named(descriptor.targetName)
      )
      .setContextArgs({
        result: tc.typeRef("DynamoDBQueryResult", [tc.typeRef(descriptor.targetName)]),
      });
  }

  private _setbatchGetCommandCtx() {
    this.code
      .addImport("@aws-appsync/utils", tc.named("DynamoDBBatchGetItemRequest"))
      .addImport(
        "../schema-types",
        tc.named("DynamoDbBatchGetResult"),
        tc.named("PipelinePrevResult"),
        tc.named("Node")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef("DynamoDBBatchGetItemRequest")]),
        result: tc.typeRef("DynamoDbBatchGetResult", [tc.typeRef("Node")]),
      });
  }

  private _setGetItemCommandCtx() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("GetInput"))
      .addImport("../schema-types", tc.named("PipelinePrevResult"), tc.named("Node"))
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef("GetInput")]),
        result: tc.typeRef("Node"),
      });
  }

  private _setPutItemCommandCtx() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("PutInput"))
      .addImport("../schema-types", tc.named("PipelinePrevResult"), tc.named("Node"))
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef("PutInput")]),
        result: tc.typeRef("Node"),
      });
  }

  private _setDeleteItemCommandCtx() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("RemoveInput"))
      .addImport("../schema-types", tc.named("PipelinePrevResult"), tc.named("Node"))
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef("RemoveInput")]),
        result: tc.typeRef("Node"),
      });
  }

  private _setQueryItemsCommandCtx() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("QueryInput"))
      .addImport(
        "../schema-types",
        tc.named("PipelinePrevResult"),
        tc.named("Node"),
        tc.named("DynamoDBQueryResult")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef("QueryInput", [tc.typeRef("Node")])]),
        result: tc.typeRef("DynamoDBQueryResult", [tc.typeRef("Node")]),
      });
  }

  private _setContextTypes(loader: LoaderDescriptor) {
    if (isFieldLoader(loader)) {
      this._setDefaultContextTypes(loader);
    }

    switch (loader.action.type) {
      case "queryItems":
        this._setQueryItemsCtx(loader);
        break;
      case "batchGetItemsCommand":
        this._setbatchGetCommandCtx();
        break;
      case "getItemCommand":
        this._setGetItemCommandCtx();
        break;
      case "putItemCommand":
        this._setPutItemCommandCtx();
        break;
      case "deleteItemCommand":
        this._setDeleteItemCommandCtx();
        break;
      case "queryItemsCommand":
        this._setQueryItemsCommandCtx();
        break;
      default:
        this.code.addImport("../schema-types", tc.named(loader.targetName)).setContextArgs({
          result: tc.typeRef(loader.targetName),
        });
        break;
    }
  }

  // #endregion Context Types

  // #region Field Operations
  private _getItem(descriptor: LoaderDescriptor) {
    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("get"));
    this.code.setRequest(
      tc.return(tc.call(tc.ref("get"), tc.obj({ key: parseKey(descriptor.action.key) })))
    );
  }

  private _queryItems(descriptor: LoaderDescriptor) {
    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("query"));
    this.code.setRequest(
      tc.return(
        tc.call(
          tc.ref("query"),
          tc.obj({
            query: parseKey(descriptor.action.key),
            filter: tc.ref("ctx.args.filter"),
            limit: tc.coalesce(tc.ref("ctx.args.first"), tc.num(100)),
            nextToken: tc.coalesce(tc.ref("ctx.args.after"), tc.undef()),
            scanIndexForward: tc.eq(tc.ref("ctx.args.sort"), tc.str("ASC")),
            index: descriptor.action.index ? tc.str(descriptor.action.index) : tc.undef(),
          })
        )
      )
    );
  }

  private _putItem(descriptor: LoaderDescriptor) {
    const typename: string = descriptor.targetName;

    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("put")).setRequest(
      tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
      tc.const("id", tc.coalesce(tc.ref("input.id"), tc.call(tc.ref("util.autoId"), []))),
      tc.const(
        "createdAt",
        tc.coalesce(tc.ref("input.createdAt"), tc.call(tc.ref("util.time.nowISO8601"), []))
      ),
      tc.const(
        "item",
        tc.obj(tc.spread("input"), {
          id: tc.ref("id"),
          createdAt: tc.ref("createdAt"),
          updatedAt: tc.coalesce(tc.ref("input.updatedAt"), tc.ref("createdAt")),
          __typename: tc.str(typename),
          _version: tc.coalesce(tc.ref("input._version"), tc.num(1)),
          _sk: tc.tick(`${typename}#\${id}`),
        })
      ),
      tc.return(
        tc.call(
          tc.ref("put"),
          tc.obj({
            key: tc.obj({ id: tc.ref("item.id") }),
            item: tc.ref("item"),
            condition: tc.obj({
              id: tc.obj({
                attributeExists: tc.bool(false),
              }),
            }),
          })
        )
      )
    );
  }

  private _updateItem() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("update"), tc.named("operations"))
      .setRequest(
        tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
        tc.const(
          "updatedAt",
          tc.coalesce(tc.ref("input.updatedAt"), tc.call(tc.ref("util.time.nowISO8601"), []))
        ),
        tc.const(
          "attributes",
          tc.obj(tc.spread("input"), {
            id: tc.ref("input.id"),
            updatedAt: tc.ref("updatedAt"),
          })
        ),
        tc.const(
          tc.ref("item", tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("unknown")])),
          tc.obj({ _version: tc.call(tc.ref("operations.increment"), [tc.num(1)]) })
        ),
        tc.forOf(
          tc.const(tc.arr(tc.ref("key"), tc.ref("value"))),
          tc.call(tc.ref("Object.entries"), [tc.ref("attributes")]),
          tc.assign(tc.ref("item[key]"), tc.call(tc.ref("operations.replace"), [tc.ref("value")]))
        ),
        tc.return(
          tc.call(
            tc.ref("update"),
            tc.obj({
              key: tc.obj({ id: tc.ref("input.id") }),
              update: tc.ref("item"),
              condition: tc.obj({
                id: tc.obj({
                  attributeExists: tc.bool(true),
                }),
                _version: tc.obj({ eq: tc.ref("input._version") }),
              }),
            })
          )
        )
      );
  }

  private _deleteItem(descriptor: LoaderDescriptor) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("update"), tc.named("operations"))
      .setRequest(
        tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
        tc.return(
          tc.call(
            tc.ref("update"),
            tc.obj({
              key: parseKey(descriptor.action.key),
              update: tc.obj({
                updatedAt: tc.call(tc.ref("operations.replace"), [
                  tc.call(tc.ref("util.time.nowISO8601"), []),
                ]),
                _version: tc.call(tc.ref("operations.increment"), [tc.num(1)]),
                _deleted: tc.call(tc.ref("operations.replace"), [tc.bool(true)]),
              }),
              condition: tc.obj({
                id: tc.obj({ attributeExists: tc.bool(true) }),
                _version: tc.obj({ eq: tc.ref("input._version") }),
              }),
            })
          )
        )
      );
  }

  // #endregion Field Operations

  // #region Edges Operations

  private _createEdge(descriptor: LoaderDescriptor) {
    const typename: string = descriptor.targetName;
    this.code.setRequest(
      tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
      tc.const("id", tc.tick("${input.sourceId}#${input.targetId}")),
      tc.const("timestamp", tc.call(tc.ref("util.time.nowISO8601"), [])),
      tc.const(
        "createItemCommand",
        tc.obj({
          key: tc.obj({ id: tc.ref("id") }),
          item: tc.obj(tc.spread("input"), {
            id: tc.ref("id"),
            createdAt: tc.ref("timestamp"),
            updatedAt: tc.ref("timestamp"),
            __typename: tc.str(typename),
            _sk: tc.tick(`${typename}#\${id}`),
          }),
          condition: tc.obj({
            id: tc.obj({
              attributeExists: tc.bool(false),
            }),
          }),
        })
      ),
      tc.const(
        "getItemCommand",
        tc.obj({
          key: tc.obj({ id: tc.ref("input.targetId") }),
        })
      ),
      tc.return(tc.obj({ commands: tc.arr(tc.ref("createItemCommand"), tc.ref("getItemCommand")) }))
    );
  }

  private _deleteEdge() {
    this.code.setRequest(
      tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
      tc.const("id", tc.tick("${input.sourceId}#${input.targetId}")),
      tc.const(
        "deleteItemCommand",
        tc.obj({
          key: tc.obj({ id: tc.ref("id") }),
          condition: tc.obj({
            id: tc.obj({ attributeExists: tc.bool(true) }),
          }),
        })
      ),
      tc.const(
        "getItemCommand",
        tc.obj({
          key: tc.obj({ id: tc.ref("input.targetId") }),
        })
      ),
      tc.return(tc.obj({ commands: tc.arr(tc.ref("deleteItemCommand"), tc.ref("getItemCommand")) }))
    );
  }

  private _queryEdges(descriptor: LoaderDescriptor) {
    this.code.setRequest(
      tc.const(
        "queryItemsCommand",
        tc.obj({
          query: parseKey(descriptor.action.key),
          filter: tc.ref("ctx.args.filter"),
          limit: tc.coalesce(tc.ref("ctx.args.first"), tc.num(100)),
          nextToken: tc.coalesce(tc.ref("ctx.args.after"), tc.undef()),
          scanIndexForward: tc.eq(tc.ref("ctx.args.sort"), tc.str("ASC")),
          index: descriptor.action.index ? tc.str(descriptor.action.index) : tc.undef(),
        })
      ),
      tc.const("batchGetItemsCommand", tc.obj({ tables: tc.obj({}) })),
      tc.return(
        tc.obj({ commands: tc.arr(tc.ref("queryItemsCommand"), tc.ref("batchGetItemsCommand")) })
      )
    );
  }

  // #endregion Edges Operations

  // #region Pipeline Function Commands
  private _getItemCommand() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("get"))
      .setRequest(
        tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
        tc.if(
          tc.not(tc.ref("command")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
        ),
        tc.return(tc.call(tc.ref("get"), tc.ref("command.payload")))
      );
  }

  private _batchGetItemsCommand() {
    this.code.addImport("@aws-appsync/utils", tc.named("runtime")).setRequest(
      tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
      tc.if(
        tc.not(tc.ref("command")),
        tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
      ),
      tc.return(
        tc.obj({
          operation: tc.str("BatchGetItem"),
          tables: tc.obj({}),
        })
      )
    );
  }

  private _queryItemsCommand() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("query"))
      .setRequest(
        tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
        tc.if(
          tc.not(tc.ref("command")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
        ),
        tc.return(tc.call(tc.ref("query"), tc.ref("command.payload")))
      );
  }

  private _putItemCommand() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("put"))
      .setRequest(
        tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
        tc.if(
          tc.not(tc.ref("command")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
        ),
        tc.return(tc.call(tc.ref("put"), tc.ref("command.payload")))
      );
  }

  private _updateItemCommand() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("update"))
      .setRequest(
        tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
        tc.if(
          tc.not(tc.ref("command")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
        ),
        tc.return(tc.call(tc.ref("update"), tc.ref("command.payload")))
      );
  }

  private _deleteItemCommand() {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("remove"))
      .setRequest(
        tc.const("command", tc.call(tc.ref("ctx.prev.result.commands.shift"), [])),
        tc.if(
          tc.not(tc.ref("command")),
          tc.return(tc.call(tc.ref("runtime.earlyReturn"), [tc.null()]))
        ),
        tc.return(tc.call(tc.ref("remove"), tc.ref("command")))
      );
  }

  // #endregion Pipeline Functions Commands

  private _checkError() {
    this.code
      .addImport("@aws-appsync/utils", tc.named("util"))
      .setResponse(
        tc.if(
          tc.ref("ctx.error"),
          tc.call(tc.ref("util.error"), [tc.ref("ctx.error.message"), tc.ref("ctx.error.type")])
        )
      );
  }

  private _returnEdges() {
    this.code.setResponse(
      tc.return(
        tc.obj({
          edges: tc.call(tc.ref("ctx.result.items.map"), [
            tc.arrow(
              tc.ref("node"),
              tc.block(
                tc.return(
                  tc.obj({
                    cursor: tc.ref("node.id"),
                    node: tc.ref("node"),
                  })
                )
              )
            ),
          ]),
          pageInfo: tc.obj({
            hasPreviousPage: tc.call(tc.ref("Boolean"), tc.ref("ctx.args?.after")),
            hasNextPage: tc.call(tc.ref("Boolean"), tc.ref("ctx.result.nextToken")),
            startCursor: tc.ref("ctx.args.after"),
            endCursor: tc.ref("ctx.result.nextToken"),
          }),
        })
      )
    );
  }

  private _returnNode() {
    this.code.setResponse(
      tc.return(
        tc.obj({
          cursor: tc.ref("ctx.result.id"),
          node: tc.ref("ctx.result"),
        })
      )
    );
  }

  auth(rules: AuthorizationRule[]) {
    this.code
      .addImport("@saapless/appsync-utils", tc.named("isAuthorized"))
      .setRequest(
        tc.if(
          tc.not(
            tc.call(tc.ref("isAuthorized"), [
              tc.ref("ctx"),
              tc.arr(...rules.map((rule) => formatValue(rule))),
            ])
          ),
          tc.call(tc.ref("util.unauthorized"), [])
        )
      );
  }

  _setOperation(descriptor: LoaderDescriptor) {
    switch (descriptor.action.type) {
      case "getItem":
        this._getItem(descriptor);
        break;
      case "queryItems":
        this._queryItems(descriptor);
        break;
      case "putItem":
        this._putItem(descriptor);
        break;
      case "updateItem":
        this._updateItem();
        break;
      case "removeItem":
        this._deleteItem(descriptor);
        break;

      case "createEdge":
        this._createEdge(descriptor);
        break;
      case "deleteEdge":
        this._deleteEdge();
        break;
      case "queryEdges":
        this._queryEdges(descriptor);
        break;
      case "getItemCommand":
        this._getItemCommand();
        break;
      case "batchGetItemsCommand":
        this._batchGetItemsCommand();
        break;
      case "queryItemsCommand":
        this._queryItemsCommand();
        break;
      case "putItemCommand":
        this._putItemCommand();
        break;
      case "updateItemCommand":
        this._updateItemCommand();
        break;
      case "deleteItemCommand":
        this._deleteItemCommand();
        break;
      default:
        throw new TransformExecutionError(`Unknown operation ${descriptor.action.type}`);
    }
  }

  _setReturn(loader: LoaderDescriptor) {
    if (!loader.returnType) {
      this.code.setResponse(tc.return(tc.ref("ctx.result")));
      return;
    }

    switch (loader.returnType) {
      case "edges":
        return this._returnEdges();
      case "node":
        return this._returnNode();
      case "prev":
        this.code.setResponse(tc.return(tc.ref("ctx.prev.result")));
        break;
      case "result":
        this.code.setResponse(tc.return(tc.ref("ctx.result")));
        break;
      default:
        this.code.setResponse(tc.return(tc.ref(loader.returnType)));
        break;
    }
  }

  public generateTemplate(loader: LoaderDescriptor) {
    this._setContextTypes(loader);

    if (!loader.action) {
      throw new TransformExecutionError("`loader.action` is required for DynamoDB resolvers");
    }

    this._setOperation(loader);
    this._checkError();
    this._setReturn(loader);
  }
}
