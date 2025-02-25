import type { LoaderDescriptor } from "../utils/types";
import ts from "typescript";
import { TransformerContext } from "../context";
import { TransformExecutionError } from "../utils/errors";
import { parseKey } from "./utils";
import { ResolverGeneratorBase } from "./ResolverGeneratorBase";

export class DynamoDbGenerator extends ResolverGeneratorBase {
  constructor(context: TransformerContext) {
    super(context);
  }

  // #region Operations

  private _getItem(descriptor: LoaderDescriptor) {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("get"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("get"), undefined, [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment("key", parseKey(descriptor.action.key)),
      ]),
    ]);
  }

  private _queryItems(descriptor: LoaderDescriptor) {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("query"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("query"), undefined, [
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment("query", parseKey(descriptor.action.key)),
          ts.factory.createPropertyAssignment(
            "filter",
            ts.factory.createIdentifier("ctx.args.filter")
          ),
          ts.factory.createPropertyAssignment(
            "limit",
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("ctx.args.first"),
              ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              ts.factory.createNumericLiteral(100)
            )
          ),
          ts.factory.createPropertyAssignment(
            "nextToken",
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("ctx.args.after"),
              ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              ts.factory.createIdentifier("undefined")
            )
          ),
          ts.factory.createPropertyAssignment(
            "scanIndexForward",
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("ctx.args.sort"),
              ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
              ts.factory.createStringLiteral("ASC")
            )
          ),
          ts.factory.createPropertyAssignment(
            "index",
            descriptor.action.index
              ? ts.factory.createStringLiteral(descriptor.action.index)
              : ts.factory.createIdentifier("undefined")
          ),
        ],
        true
      ),
    ]);
  }

  private _batchGetItems(descriptor: LoaderDescriptor) {
    const dataSource = this._context.dataSources.getDataSource(descriptor.dataSource);

    if (dataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError("Invalid data source type provided to batchGetItem.");
    }

    const tableName = dataSource.config.tableName;

    return ts.factory.createObjectLiteralExpression(
      [
        ts.factory.createPropertyAssignment(
          "operation",
          ts.factory.createStringLiteral("BatchGetItem")
        ),
        ts.factory.createPropertyAssignment(
          "tables",
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                ts.factory.createComputedPropertyName(ts.factory.createStringLiteral(tableName)),
                ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier("keys"),
                      ts.factory.createIdentifier("keys")
                    ),
                  ],
                  false
                )
              ),
            ],
            true
          )
        ),
      ],
      true
    );
  }

  private _putEdgeItemInit(descriptor: LoaderDescriptor) {
    const typename: string = descriptor.targetName;

    const id = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("id"),
            undefined,
            undefined,
            ts.factory.createTemplateExpression(ts.factory.createTemplateHead(""), [
              ts.factory.createTemplateSpan(
                ts.factory.createIdentifier("ctx.args.input.sourceId"),
                ts.factory.createTemplateMiddle("#")
              ),
              ts.factory.createTemplateSpan(
                ts.factory.createIdentifier("ctx.args.input.targetId"),
                ts.factory.createTemplateTail("")
              ),
            ])
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const timestamp = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("timestamp"),
            undefined,
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("util.time"),
                ts.factory.createIdentifier("nowISO8601")
              ),
              undefined,
              []
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const values = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("values"),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(ts.factory.createIdentifier("ctx.args.input")),
                ts.factory.createPropertyAssignment("id", ts.factory.createIdentifier("id")),
                ts.factory.createPropertyAssignment(
                  "createdAt",
                  ts.factory.createIdentifier("timestamp")
                ),
                ts.factory.createPropertyAssignment(
                  "updatedAt",
                  ts.factory.createIdentifier("timestamp")
                ),
                ts.factory.createPropertyAssignment(
                  "__typename",
                  ts.factory.createStringLiteral(typename)
                ),
                ts.factory.createPropertyAssignment(
                  "_sk",
                  ts.factory.createTemplateExpression(
                    ts.factory.createTemplateHead(`${typename}#`),
                    [
                      ts.factory.createTemplateSpan(
                        ts.factory.createIdentifier("id"),
                        ts.factory.createTemplateTail("")
                      ),
                    ]
                  )
                ),
              ],
              true
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return [id, timestamp, values];
  }

  private _putItemInit(descriptor: LoaderDescriptor) {
    const typename: string = descriptor.targetName;

    if (descriptor.isEdge) {
      return this._putEdgeItemInit(descriptor);
    }

    const id = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("id"),
            undefined,
            undefined,
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("ctx.args.input.id"),
              ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("util"),
                  ts.factory.createIdentifier("autoId")
                ),
                undefined,
                []
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const timestamp = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("timestamp"),
            undefined,
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("util.time"),
                ts.factory.createIdentifier("nowISO8601")
              ),
              undefined,
              []
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const values = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("values"),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(ts.factory.createIdentifier("ctx.args.input")),
                ts.factory.createPropertyAssignment("id", ts.factory.createIdentifier("id")),
                ts.factory.createPropertyAssignment(
                  "createdAt",
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier("ctx.args.input.createdAt"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    ts.factory.createIdentifier("timestamp")
                  )
                ),
                ts.factory.createPropertyAssignment(
                  "updatedAt",
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier("ctx.args.input.updatedAt"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    ts.factory.createIdentifier("timestamp")
                  )
                ),
                ts.factory.createPropertyAssignment(
                  "__typename",
                  ts.factory.createStringLiteral(typename)
                ),
                ts.factory.createPropertyAssignment(
                  "_sk",
                  ts.factory.createTemplateExpression(
                    ts.factory.createTemplateHead(`${typename}#`),
                    [
                      ts.factory.createTemplateSpan(
                        ts.factory.createIdentifier("id"),
                        ts.factory.createTemplateTail("")
                      ),
                    ]
                  )
                ),
              ],
              true
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    return [id, timestamp, values];
  }

  private _putItem(payloadRef: string) {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("put"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("put"), undefined, [
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            "key",
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                "id",
                ts.factory.createIdentifier(`${payloadRef}.id`)
              ),
            ])
          ),
          ts.factory.createPropertyAssignment("item", ts.factory.createIdentifier(payloadRef)),
          ts.factory.createPropertyAssignment(
            "condition",
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  "id",
                  ts.factory.createObjectLiteralExpression(
                    [
                      ts.factory.createPropertyAssignment(
                        "attributeExists",
                        ts.factory.createFalse()
                      ),
                    ],
                    true
                  )
                ),
              ],
              true
            )
          ),
        ],
        true
      ),
    ]);
  }

  private _updateItemInit(loader: LoaderDescriptor) {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("operations"))
    );

    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("DynamoDBUpdateObject")
      )
    );

    const input = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("input"),
            undefined,
            // ts.factory.createTypeReferenceNode(""),
            undefined,
            ts.factory.createObjectLiteralExpression([
              ts.factory.createSpreadAssignment(ts.factory.createIdentifier("ctx.args.input")),
              ts.factory.createPropertyAssignment(
                "updatedAt",
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier("ctx.args.input.updatedAt"),
                  ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("util.time"),
                      ts.factory.createIdentifier("nowISO8601")
                    ),
                    undefined,
                    []
                  )
                )
              ),
            ])
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const values = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("values"),
            undefined,
            ts.factory.createTypeReferenceNode("DynamoDBUpdateObject", [
              ts.factory.createTypeReferenceNode(loader.targetName),
            ]),
            ts.factory.createObjectLiteralExpression([], false)
          ),
        ],
        ts.NodeFlags.Const
      )
    );

    const loop = ts.factory.createForOfStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createArrayBindingPattern([
              ts.factory.createBindingElement(undefined, undefined, "key"),
              ts.factory.createBindingElement(undefined, undefined, "value"),
            ]),
            undefined,
            undefined
          ),
        ],
        ts.NodeFlags.Const
      ),
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("Object"),
          ts.factory.createIdentifier("entries")
        ),
        undefined,
        [ts.factory.createIdentifier("input")]
      ),
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("Object"),
              ts.factory.createIdentifier("assign")
            ),
            undefined,
            [
              ts.factory.createIdentifier("values"),
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                  ts.factory.createComputedPropertyName(ts.factory.createIdentifier("key")),
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("operations"),
                      ts.factory.createIdentifier("replace")
                    ),
                    undefined,
                    [ts.factory.createIdentifier("value")]
                  )
                ),
              ]),
            ]
          )
        ),
      ])
    );

    return [input, values, loop];
  }

  private _updateItem(payloadRef: string) {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("update"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("update"), undefined, [
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            "key",
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                "id",
                ts.factory.createIdentifier(`${payloadRef}.id`)
              ),
            ])
          ),
          ts.factory.createPropertyAssignment("update", ts.factory.createIdentifier(payloadRef)),
          ts.factory.createPropertyAssignment(
            "condition",
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  "id",
                  ts.factory.createObjectLiteralExpression(
                    [
                      ts.factory.createPropertyAssignment(
                        "attributeExists",
                        ts.factory.createTrue()
                      ),
                    ],
                    true
                  )
                ),
              ],
              true
            )
          ),
        ],
        true
      ),
    ]);
  }

  private _deleteItemInit(descriptor: LoaderDescriptor) {
    const initializer = descriptor.isEdge
      ? ts.factory.createTemplateExpression(ts.factory.createTemplateHead(""), [
          ts.factory.createTemplateSpan(
            ts.factory.createIdentifier("ctx.args.input.sourceId"),
            ts.factory.createTemplateMiddle("#")
          ),
          ts.factory.createTemplateSpan(
            ts.factory.createIdentifier("ctx.args.input.targetId"),
            ts.factory.createTemplateTail("")
          ),
        ])
      : ts.factory.createIdentifier(`ctx.args.id`);

    return [
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("id"),
              undefined,
              undefined,
              initializer
            ),
          ],
          ts.NodeFlags.Const
        )
      ),
    ];
  }

  private _deleteItem() {
    this._setImport(
      "@aws-appsync/utils/dynamodb",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("remove"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("remove"), undefined, [
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            "key",
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment("id", ts.factory.createIdentifier(`id`)),
            ])
          ),
          ts.factory.createPropertyAssignment(
            "condition",
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  "id",
                  ts.factory.createObjectLiteralExpression(
                    [
                      ts.factory.createPropertyAssignment(
                        "attributeExists",
                        ts.factory.createTrue()
                      ),
                    ],
                    true
                  )
                ),
              ],
              true
            )
          ),
        ],
        true
      ),
    ]);
  }

  private _getOperationInit(descriptor: LoaderDescriptor): ts.Statement[] {
    switch (descriptor.action.type) {
      case "putItem":
        return this._putItemInit(descriptor);
      case "updateItem":
        return this._updateItemInit(descriptor);
      case "removeItem":
        return this._deleteItemInit(descriptor);
      default:
        return [];
    }
  }

  private _getOperation(descriptor: LoaderDescriptor) {
    switch (descriptor.action.type) {
      case "getItem":
        return this._getItem(descriptor);
      case "queryItems":
        return this._queryItems(descriptor);
      case "batchGetItems":
        return this._batchGetItems(descriptor);
      case "putItem":
        return this._putItem("values");
      case "updateItem":
        return this._updateItem("values");
      case "upsertItem":
        return ts.factory.createNull();
      case "removeItem":
        return this._deleteItem();
      default:
        throw new TransformExecutionError(`Operation not implemented: ${descriptor.action.type}`);
    }
  }

  // #endregion Operations

  // // #region Return Types
  // private _returnEdges() {
  //   this.code.setResponse(
  //     tc.return(
  //       tc.obj({
  //         edges: tc.call(tc.ref("ctx.result.items.map"), [
  //           tc.arrow(
  //             tc.ref("node"),
  //             tc.block(
  //               tc.return(
  //                 tc.obj({
  //                   cursor: tc.ref("node.id"),
  //                   node: tc.ref("node"),
  //                 })
  //               )
  //             )
  //           ),
  //         ]),
  //         pageInfo: tc.obj({
  //           hasPreviousPage: tc.call(tc.ref("Boolean"), tc.ref("ctx.args?.after")),
  //           hasNextPage: tc.call(tc.ref("Boolean"), tc.ref("ctx.result.nextToken")),
  //           startCursor: tc.ref("ctx.args.after"),
  //           endCursor: tc.ref("ctx.result.nextToken"),
  //         }),
  //       })
  //     )
  //   );
  // }

  // private _returnNode() {
  //   this.code.setResponse(
  //     tc.return(
  //       tc.obj({
  //         cursor: tc.ref("ctx.result.id"),
  //         node: tc.ref("ctx.result"),
  //       })
  //     )
  //   );
  // }

  // private _returnQueryEdges(descriptor: LoaderDescriptor) {
  //   const dataSource = this.context.dataSources.getDataSource(descriptor.dataSource);

  //   if (dataSource.type !== "DYNAMO_DB") {
  //     throw new TransformExecutionError(
  //       `Invalid dataSource ${descriptor.dataSource} provided to DynamoDB generator`
  //     );
  //   }

  //   this.code.setResponse(
  //     tc.const(
  //       tc.arr(tc.ref("queryResult"), tc.ref("batchGetResult")),
  //       tc.ref("ctx.prev.result.results")
  //     ),
  //     tc.const("items", tc.ref(`batchGetResult.data["${dataSource.config.tableName}"]`)),
  //     tc.return(
  //       tc.obj({
  //         edges: tc.call(tc.ref("items.map"), [
  //           tc.arrow(
  //             tc.ref("node"),
  //             tc.block(
  //               tc.return(
  //                 tc.obj({
  //                   cursor: tc.ref("node.id"),
  //                   node: tc.ref("node"),
  //                 })
  //               )
  //             )
  //           ),
  //         ]),
  //         pageInfo: tc.obj({
  //           hasPreviousPage: tc.call(tc.ref("Boolean"), tc.ref("ctx.args?.after")),
  //           hasNextPage: tc.call(tc.ref("Boolean"), tc.ref("queryResult.nextToken")),
  //           startCursor: tc.ref("ctx.args.after"),
  //           endCursor: tc.ref("queryResult.nextToken"),
  //         }),
  //       })
  //     )
  //   );
  // }

  // private _returnCreateEdge() {
  //   this.code.setResponse(
  //     tc.const(
  //       tc.arr(tc.ref("createResult"), tc.ref("getItemResult")),
  //       tc.ref("ctx.prev.result.results")
  //     ),
  //     tc.return(
  //       tc.obj({
  //         cursor: tc.ref("getItemResult.id"),
  //         node: tc.ref("getItemResult"),
  //       })
  //     )
  //   );
  // }

  // private _returnCommandResult() {
  //   this.code.setResponse(
  //     tc.const("prevResult", tc.ref("ctx.prev.result")),
  //     tc.if(
  //       tc.not(tc.ref("prevResult.results")),
  //       tc.assign(tc.ref("prevResult.results"), tc.arr(tc.ref("ctx.result"))),
  //       tc.call(tc.ref("prevResult.results.push"), [tc.ref("ctx.result")])
  //     ),
  //     tc.return(tc.ref("prevResult"))
  //   );
  // }

  // _setReturn(loader: LoaderDescriptor) {
  //   if (!loader.returnType) {
  //     this.code.setResponse(tc.return(tc.ref("ctx.result")));
  //     return;
  //   }

  //   switch (loader.returnType) {
  //     case "edges":
  //       return this._returnEdges();
  //     case "node":
  //       return this._returnNode();
  //     case "prev":
  //       this.code.setResponse(tc.return(tc.ref("ctx.prev.result")));
  //       break;
  //     case "result":
  //       this.code.setResponse(tc.return(tc.ref("ctx.result")));
  //       break;
  //     // case "createEdge":
  //     // case "deleteEdge":
  //     //   this._returnCreateEdge();
  //     //   break;
  //     // case "queryEdges":
  //     //   this._returnQueryEdges(loader);
  //     //   break;
  //     // case "command":
  //     //   this._returnCommandResult();
  //     //   break;
  //     default:
  //       this.code.setResponse(tc.return(tc.ref("ctx.result")));
  //       break;
  //   }
  // }

  // // #endregion Return Types

  // auth(rules: AuthorizationRule[]) {
  //   this.code
  //     .addImport("@saapless/appsync-utils", tc.named("isAuthorized"))
  //     .setRequest(
  //       tc.if(
  //         tc.not(
  //           tc.call(tc.ref("isAuthorized"), [
  //             tc.ref("ctx"),
  //             tc.arr(...rules.map((rule) => formatValue(rule))),
  //           ])
  //         ),
  //         tc.call(tc.ref("util.unauthorized"), [])
  //       )
  //     );
  // }

  public generate(filename: string) {
    return this._printDefinitions(filename);
  }

  public generateTemplate(loader: LoaderDescriptor) {
    // Setup request types;
    // Init;
    // Auth;
    // Precheck;
    // Init operation;
    // Operation;
    this._setRequestFunction(
      loader,
      ts.factory.createBlock(
        [
          ...this._getOperationInit(loader),
          ts.factory.createReturnStatement(this._getOperation(loader)),
        ],
        true
      )
    );

    // Setup response types;
    // Check error;
    // Format response;
    // Return;
    this._setResponseFunction(
      loader,
      ts.factory.createBlock(
        [this._checkResponseError(), ts.factory.createReturnStatement(this._formatResult(loader))],
        true
      )
    );

    return this._printDefinitions(this._getFileName(loader));
  }
}
