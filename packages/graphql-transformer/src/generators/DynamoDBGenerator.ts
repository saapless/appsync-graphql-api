import type { AuthorizationRule, LoaderDescriptor } from "../utils/types";
import { TransformerContext } from "../context";
import { CodeDocument, tc } from "../codegen";
import { TransformExecutionError } from "../utils/errors";
import { formatValue, isFieldLoader } from "./utils";
import { ResolverGeneratorBase } from "./ResolverGeneratorBase";

export class DynamoDbGenerator extends ResolverGeneratorBase {
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
        tc.named("DynamoDBBatchGetResult"),
        tc.named("PipelinePrevResult"),
        tc.named("Node")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeRef("DynamoDBBatchGetItemRequest"),
          tc.typeRef("DynamoDBBatchGetResult", [tc.typeRef("Node")]),
        ]),
        result: tc.typeRef("DynamoDBBatchGetResult", [tc.typeRef("Node")]),
      });
  }

  private _setItemCommandCtx(input: string) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named(input))
      .addImport("../schema-types", tc.named("PipelinePrevResult"), tc.named("Node"))
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [tc.typeRef(input), tc.typeRef("Node")]),
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
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeRef("QueryInput", [tc.typeRef("Node")]),
          tc.typeRef("DynamoDBQueryResult", [tc.typeRef("Node")]),
        ]),
        result: tc.typeRef("DynamoDBQueryResult", [tc.typeRef("Node")]),
      });
  }

  private _setCreateEdgeCtx(descriptor: LoaderDescriptor) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("PutInput"), tc.named("GetInput"))
      .addImport(
        "../schema-types",
        tc.named("PipelinePrevResult"),
        tc.named(descriptor.targetName),
        tc.named("Node")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeTuple(tc.typeRef("PutInput"), tc.typeRef("GetInput")),
          tc.typeTuple(tc.typeRef(descriptor.targetName), tc.typeRef("Node")),
        ]),
      });
  }
  private _setDeleteEdgeCtx(descriptor: LoaderDescriptor) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("RemoveInput"), tc.named("GetInput"))
      .addImport(
        "../schema-types",
        tc.named("PipelinePrevResult"),
        tc.named(descriptor.targetName),
        tc.named("Node")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeTuple(tc.typeRef("RemoveInput"), tc.typeRef("GetInput")),
          tc.typeTuple(tc.typeRef(descriptor.targetName), tc.typeRef("Node")),
        ]),
      });
  }
  private _setQueryEdgesCtx(descriptor: LoaderDescriptor) {
    this.code
      .addImport("@aws-appsync/utils", tc.named("DynamoDBBatchGetItemRequest"))
      .addImport("@aws-appsync/utils/dynamodb", tc.named("QueryInput"))
      .addImport(
        "../schema-types",
        tc.named("PipelinePrevResult"),
        tc.named("DynamoDBQueryResult"),
        tc.named("DynamoDBBatchGetResult"),
        tc.named(descriptor.targetName),
        tc.named("Node")
      )
      .setContextArgs({
        prev: tc.typeRef("PipelinePrevResult", [
          tc.typeTuple(
            tc.typeRef("QueryInput", [tc.typeRef(descriptor.targetName)]),
            tc.typeRef("DynamoDBBatchGetItemRequest")
          ),
          tc.typeTuple(
            tc.typeRef("DynamoDBQueryResult", [tc.typeRef(descriptor.targetName)]),
            tc.typeRef("DynamoDBBatchGetResult", [tc.typeRef("Node")])
          ),
        ]),
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
      // case "createEdge":
      //   this._setCreateEdgeCtx(loader);
      //   break;
      // case "deleteEdge":
      //   this._setDeleteEdgeCtx(loader);
      //   break;
      // case "queryEdges":
      //   this._setQueryEdgesCtx(loader);
      //   break;
      // case "batchGetItemsCommand":
      //   this._setbatchGetCommandCtx();
      //   break;
      // case "getItemCommand":
      //   this._setItemCommandCtx("GetInput");
      //   break;
      // case "putItemCommand":
      //   this._setItemCommandCtx("PutInput");
      //   break;
      // case "updateItemCommand":
      //   this._setItemCommandCtx("UpdateInput");
      //   break;
      // case "deleteItemCommand":
      //   this._setItemCommandCtx("RemoveInput");
      //   break;
      // case "queryItemsCommand":
      //   this._setQueryItemsCommandCtx();
      //   break;
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
      tc.return(tc.call(tc.ref("get"), tc.obj({ key: this._getKey(descriptor.action.key) })))
    );
  }

  private _queryItems(descriptor: LoaderDescriptor) {
    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("query"));
    this.code.setRequest(
      tc.return(
        tc.call(
          tc.ref("query"),
          tc.obj({
            query: this._getKey(descriptor.action.key),
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
          _sk: tc.tick(`${typename}#\${id}`),
          _version: tc.coalesce(tc.ref("input._version"), tc.num(1)),
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

  private _upsertItem(descriptor: LoaderDescriptor) {
    const typename: string = descriptor.targetName;

    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("update"), tc.named("operations"))
      .setRequest(
        tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
        tc.const("id", tc.coalesce(tc.ref("input.id"), tc.call(tc.ref("util.autoId"), []))),
        tc.const("timestamp", tc.call(tc.ref("util.time.nowISO8601"), [])),
        tc.const(
          "createdAt",
          tc.ternary(tc.not(tc.ref("input.id")), tc.ref("timestamp"), tc.undef())
        ),
        tc.const("updatedAt", tc.coalesce(tc.ref("input.updatedAt"), tc.ref("timestamp"))),
        tc.const(
          "attributes",
          tc.obj(tc.spread("input"), {
            createdAt: tc.coalesce(tc.ref("input.createdAt"), tc.ref("createdAt")),
            updatedAt: tc.ref("updatedAt"),
            __typename: tc.str(typename),
            _sk: tc.tick(`${typename}#\${id}`),
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
              key: tc.obj(tc.ref("id")),
              update: tc.ref("item"),
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
              key: this._getKey(descriptor.action.key),
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
      tc.return(
        tc.obj({
          commands: tc.arr(tc.ref("createItemCommand"), tc.ref("getItemCommand")),
          results: tc.arr(),
        })
      )
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
      tc.return(
        tc.obj({
          commands: tc.arr(tc.ref("deleteItemCommand"), tc.ref("getItemCommand")),
          results: tc.arr(),
        })
      )
    );
  }

  private _queryEdges(descriptor: LoaderDescriptor) {
    const dataSource = this.context.dataSources.getDataSource(descriptor.dataSource);

    if (dataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError(
        `DataSource ${descriptor.dataSource} is not a DynamoDB data source`
      );
    }

    this.code.setRequest(
      tc.const(
        "queryItemsCommand",
        tc.obj({
          query: this._getKey(descriptor.action.key),
          filter: tc.ref("ctx.args.filter"),
          limit: tc.coalesce(tc.ref("ctx.args.first"), tc.num(100)),
          nextToken: tc.coalesce(tc.ref("ctx.args.after"), tc.undef()),
          scanIndexForward: tc.eq(tc.ref("ctx.args.sort"), tc.str("ASC")),
          index: descriptor.action.index ? tc.str(descriptor.action.index) : tc.undef(),
        })
      ),
      tc.const(
        "mapItemsCommand",
        tc.obj({
          tableName: tc.str(dataSource.config.tableName),
          keyPath: tc.str("targetId"),
        })
      ),
      tc.const(
        "batchGetItemsCommand",
        tc.obj({
          operation: tc.str("BatchGetItem"),
          tables: tc.obj({}),
          // instructions: tc.obj({
          //   fromPrevResult: tc.bool(true),
          //   prevResultIndex: tc.num(0),
          //   tableName: tc.str(dataSource.config.tableName),
          //   prevResultType: tc.str("queryItems"),
          //   keyPath: tc.str("targetId"),
          // }),
        })
      ),
      tc.return(
        tc.obj({
          commands: tc.arr(
            tc.ref("queryItemsCommand"),
            tc.ref("mapItemsCommand"),
            tc.ref("batchGetItemsCommand")
          ),
          results: tc.arr(),
        })
      )
    );
  }

  // #endregion Edges Operations

  // #region Pipeline Function Commands

  private _getItemCommand(action: string) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named(action))
      .setRequest(...this._getCommand(), tc.return(tc.call(tc.ref(action), tc.ref("command"))));
  }

  private _batchGetItemsCommand() {
    this.code.addImport("@aws-appsync/utils", tc.named("runtime")).setRequest(
      ...this._getCommand(),
      // tc.if(tc.ref("command.instructions?.fromPrevResult"), [
      //   tc.const(
      //     "prevResult",
      //     tc.ref("ctx.prev.result.results?.[`${command.instructions.prevResultIndex}`]")
      //   ),

      //   tc.const(
      //     "keys",
      //     tc.call(tc.ref("prevResult.items.map"), [
      //       tc.arrow(tc.ref("item"), tc.ref("({ id: item[command.instructions.keyPath] })")),
      //     ])
      //   ),
      //   tc.assign(
      //     tc.ref("command.payload.tables[command.instructions.tableName]"),
      //     tc.call(tc.ref("keys.filter"), [tc.ref("Boolean")])
      //   ),
      // ]),
      tc.return(
        tc.obj({
          operation: tc.str("BatchGetItem"),
          tables: tc.ref("command.tables"),
        })
      )
    );
  }

  // #endregion Pipeline Functions Commands

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
      case "upsertItem":
        this._upsertItem(descriptor);
        break;
      case "removeItem":
        this._deleteItem(descriptor);
        break;

      // case "createEdge":
      //   this._createEdge(descriptor);
      //   break;
      // case "deleteEdge":
      //   this._deleteEdge();
      //   break;
      // case "queryEdges":
      //   this._queryEdges(descriptor);
      //   break;
      // case "getItemCommand":
      //   this._getItemCommand("get");
      //   break;
      // case "putItemCommand":
      //   this._getItemCommand("put");
      //   break;
      // case "updateItemCommand":
      //   this._getItemCommand("update");
      //   break;
      // case "deleteItemCommand":
      //   this._getItemCommand("remove");
      //   break;
      // case "queryItemsCommand":
      //   this._getItemCommand("query");
      //   break;
      // case "batchGetItemsCommand":
      //   this._batchGetItemsCommand();
      //   break;
      default:
        throw new TransformExecutionError(`Unknown operation ${descriptor.action.type}`);
    }
  }

  // #region Return Types
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

  private _returnQueryEdges(descriptor: LoaderDescriptor) {
    const dataSource = this.context.dataSources.getDataSource(descriptor.dataSource);

    if (dataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError(
        `Invalid dataSource ${descriptor.dataSource} provided to DynamoDB generator`
      );
    }

    this.code.setResponse(
      tc.const(
        tc.arr(tc.ref("queryResult"), tc.ref("batchGetResult")),
        tc.ref("ctx.prev.result.results")
      ),
      tc.const("items", tc.ref(`batchGetResult.data["${dataSource.config.tableName}"]`)),
      tc.return(
        tc.obj({
          edges: tc.call(tc.ref("items.map"), [
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
            hasNextPage: tc.call(tc.ref("Boolean"), tc.ref("queryResult.nextToken")),
            startCursor: tc.ref("ctx.args.after"),
            endCursor: tc.ref("queryResult.nextToken"),
          }),
        })
      )
    );
  }

  private _returnCreateEdge() {
    this.code.setResponse(
      tc.const(
        tc.arr(tc.ref("createResult"), tc.ref("getItemResult")),
        tc.ref("ctx.prev.result.results")
      ),
      tc.return(
        tc.obj({
          cursor: tc.ref("getItemResult.id"),
          node: tc.ref("getItemResult"),
        })
      )
    );
  }

  private _returnCommandResult() {
    this.code.setResponse(
      tc.const("prevResult", tc.ref("ctx.prev.result")),
      tc.if(
        tc.not(tc.ref("prevResult.results")),
        tc.assign(tc.ref("prevResult.results"), tc.arr(tc.ref("ctx.result"))),
        tc.call(tc.ref("prevResult.results.push"), [tc.ref("ctx.result")])
      ),
      tc.return(tc.ref("prevResult"))
    );
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
      // case "createEdge":
      // case "deleteEdge":
      //   this._returnCreateEdge();
      //   break;
      // case "queryEdges":
      //   this._returnQueryEdges(loader);
      //   break;
      // case "command":
      //   this._returnCommandResult();
      //   break;
      default:
        this.code.setResponse(tc.return(tc.ref("ctx.result")));
        break;
    }
  }

  // #endregion Return Types

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
