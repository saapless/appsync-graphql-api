import type {
  AuthorizationRule,
  FieldLoaderDescriptor,
  Key,
  LoaderDescriptor,
} from "../../utils/types";
import { TransformerContext } from "../../context";
import { CodeDocument, PropertyValue, tc } from "../code";
import { formatValue, keyValue } from "../utils";
import { TransformExecutionError } from "../../utils/errors";
import { ContextTypesGenerator } from "./ContextTypesGenerator";

function isFieldLoader(descriptor: LoaderDescriptor): descriptor is FieldLoaderDescriptor {
  return Object.hasOwn(descriptor, "fieldName") && Object.hasOwn(descriptor, "typeName");
}

export class DynamoDbGenerator extends ContextTypesGenerator {
  constructor(context: TransformerContext, code: CodeDocument) {
    super(context, code);
  }

  private _setContextTypes(loader: LoaderDescriptor) {
    if (isFieldLoader(loader)) {
      this._setDefaultContextTypes(loader);
    }

    if (loader.action === "list") {
      this.code.addImport("../schema-types", tc.named("DynamoDBQueryResult"));
    }

    this.code.addImport("../schema-types", tc.named(loader.targetName)).setContextArgs({
      result:
        loader.action === "list"
          ? tc.typeRef("DynamoDBQueryResult", [tc.typeRef(loader.targetName)])
          : tc.typeRef(loader.targetName),
    });
  }

  private _getKey(key: Key) {
    return tc.obj(
      Object.entries(key).reduce(
        (agg, [name, op]) => {
          if (op.ref || op.eq) {
            Object.assign(agg, { [name]: keyValue(op) });
          } else if (op.le) {
            Object.assign(agg, { [name]: tc.obj({ le: keyValue(op.le) }) });
          } else if (op.lt) {
            Object.assign(agg, { [name]: tc.obj({ lt: keyValue(op.lt) }) });
          } else if (op.ge) {
            Object.assign(agg, { [name]: tc.obj({ ge: keyValue(op.ge) }) });
          } else if (op.gt) {
            Object.assign(agg, { [name]: tc.obj({ gt: keyValue(op.gt) }) });
          } else if (op.between) {
            Object.assign(agg, {
              [name]: tc.obj({ between: tc.arr(...op.between.map((i) => keyValue(i))) }),
            });
          } else if (op.beginsWith) {
            Object.assign(agg, { [name]: tc.obj({ beginsWith: keyValue(op.beginsWith) }) });
          }
          return agg;
        },
        {} as Record<string, PropertyValue>
      )
    );
  }

  private _getItem(descriptor: LoaderDescriptor) {
    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("get"));
    this.code.setRequest(
      tc.return(tc.call(tc.ref("get"), tc.obj({ key: this._getKey(descriptor.key) })))
    );
  }

  private _queryItems(descriptor: LoaderDescriptor) {
    this.code.addImport("@aws-appsync/utils/dynamodb", tc.named("query"));
    this.code.setRequest(
      tc.return(
        tc.call(
          tc.ref("query"),
          tc.obj({
            query: this._getKey(descriptor.key),
            filter: tc.ref("ctx.args.filter"),
            limit: tc.coalesce(tc.ref("ctx.args.first"), tc.num(100)),
            nextToken: tc.coalesce(tc.ref("ctx.args.after"), tc.undef()),
            scanIndexForward: tc.eq(tc.ref("ctx.args.sort"), tc.str("ASC")),
            index: descriptor.index ? tc.str(descriptor.index) : tc.undef(),
          })
        )
      )
    );
  }

  private _putItem(operation: LoaderDescriptor) {
    const typename: string = operation.targetName;

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
          _sk: tc.tick(`${typename}\${id}`),
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

  private _deleteItem(operation: LoaderDescriptor) {
    this.code
      .addImport("@aws-appsync/utils/dynamodb", tc.named("update"), tc.named("operations"))
      .setRequest(
        tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
        tc.return(
          tc.call(
            tc.ref("update"),
            tc.obj({
              key: this._getKey(operation.key),
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

  private _returnResult() {
    this.code.setResponse(tc.return(tc.ref("ctx.result")));
  }

  private _returnPrev() {
    this.code.setResponse(tc.return(tc.ref("ctx.prev")));
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

  _setOperation(operation: LoaderDescriptor) {
    switch (operation.action) {
      case "get":
        this._getItem(operation);
        break;
      case "list":
        this._queryItems(operation);
        break;
      case "create":
        this._putItem(operation);
        break;
      case "update":
        this._updateItem();
        break;
      case "delete":
        this._deleteItem(operation);
        break;
      case "upsert":
        break;
      default:
        // throw new Error(`Unknown operation ${operation.action}`);
        break;
    }
  }

  _setReturn(loader: LoaderDescriptor) {
    switch (loader.returnType) {
      case "edges":
        return this._returnEdges();
      case "node":
        return this._returnNode();
      case "prev":
        return this._returnPrev();
      default:
        return this._returnResult();
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
