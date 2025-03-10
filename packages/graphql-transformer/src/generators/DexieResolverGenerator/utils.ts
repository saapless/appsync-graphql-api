import ts from "typescript";
import { addImport } from "../../utils";
import { Key, KeyValue, ResolverDescriptor } from "../../context";

export function getWhereMethod(clause: string) {
  switch (clause) {
    case "eq":
    case "ref":
      return ts.factory.createIdentifier("equals");
    case "ne":
      return ts.factory.createIdentifier("notEqual");
    case "lt":
      return ts.factory.createIdentifier("below");
    case "le":
      return ts.factory.createIdentifier("belowOrEqual");
    case "gt":
      return ts.factory.createIdentifier("above");
    case "ge":
      return ts.factory.createIdentifier("aboveOrEqual");
    case "between":
      return ts.factory.createIdentifier("between");
    case "beginsWith":
      return ts.factory.createIdentifier("startsWith");
    default:
      throw new Error("Not implemented");
  }
}

export function keyValue<T extends string | number>(obj: KeyValue<T>) {
  if (obj.ref) {
    return ts.factory.createIdentifier(obj.ref);
  }

  if (obj.eq) {
    return typeof obj.eq === "string"
      ? ts.factory.createStringLiteral(obj.eq)
      : ts.factory.createNumericLiteral(obj.eq);
  }

  throw new Error("Invalid key value");
}

export function createSortKeyExpression(key: Record<string, Key>) {
  return ts.factory.createObjectLiteralExpression(
    Object.entries(key).reduce((agg, [name, op]) => {
      if (op.ref || op.eq) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("eq"),
                  keyValue(op)
                ),
              ],
              true
            )
          )
        );
      } else if (op.le) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("le"),
                  keyValue(op.le)
                ),
              ],
              true
            )
          )
        );
      } else if (op.lt) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("lt"),
                  keyValue(op.lt)
                ),
              ],
              true
            )
          )
        );
      } else if (op.ge) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("ge"),
                  keyValue(op.ge)
                ),
              ],
              true
            )
          )
        );
      } else if (op.gt) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("gt"),
                  keyValue(op.gt)
                ),
              ],
              true
            )
          )
        );
      } else if (op.between) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("between"),
                  ts.factory.createArrayLiteralExpression(op.between.map((i) => keyValue(i)))
                ),
              ],
              true
            )
          )
        );
      } else if (op.beginsWith) {
        agg.push(
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(name),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("beginsWith"),
                  keyValue(op.beginsWith)
                ),
              ],
              true
            )
          )
        );
      }
      return agg;
    }, [] as ts.ObjectLiteralElementLike[])
  );
}

export function initQuery(
  { operation }: ResolverDescriptor,
  indexName?: string | null,
  sortKeyField = "__typename"
) {
  let queryCall = ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("ctx"),
            ts.factory.createIdentifier("db")
          ),
          ts.factory.createIdentifier("where")
        ),
        undefined,
        [ts.factory.createStringLiteral(indexName ?? ":id")]
      ),
      getWhereMethod(Object.keys(operation.key)[0])
    ),
    undefined,
    [keyValue(operation.key)]
  );

  if (operation.sortKey) {
    queryCall = ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(queryCall, ts.factory.createIdentifier("and")),
      undefined,
      [
        ts.factory.createCallExpression(
          ts.factory.createIdentifier("filterExpression"),
          undefined,
          [createSortKeyExpression({ [sortKeyField]: operation.sortKey })]
        ),
      ]
    );
  }

  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("query"),
          undefined,
          undefined,
          queryCall
        ),
      ],
      ts.NodeFlags.Let
    )
  );
}

export function filterQuery() {
  return ts.factory.createIfStatement(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("args"),
      ts.factory.createIdentifier("filter")
    ),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createIdentifier("query"),
            ts.factory.createToken(ts.SyntaxKind.EqualsToken),
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("query"),
                ts.factory.createIdentifier("filter")
              ),
              undefined,
              [
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier("filterExpression"),
                  undefined,
                  [
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("args"),
                      ts.factory.createIdentifier("filter")
                    ),
                  ]
                ),
              ]
            )
          )
        ),
      ],
      true
    ),
    undefined
  );
}

export function sortQuery() {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("args"),
        ts.factory.createIdentifier("sort")
      ),
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      ts.factory.createStringLiteral("DESC")
    ),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createIdentifier("query"),
            ts.factory.createToken(ts.SyntaxKind.EqualsToken),
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("query"),
                ts.factory.createIdentifier("reverse")
              ),
              undefined,
              []
            )
          )
        ),
      ],
      true
    ),
    undefined
  );
}

export function getQueryResult() {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("result"),
          undefined,
          undefined,
          ts.factory.createAwaitExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("query"),
                ts.factory.createIdentifier("toArray")
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
}

export function initCreateItem(descriptor: ResolverDescriptor) {
  return [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("id"),
            undefined,
            undefined,
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("args"),
                  ts.factory.createIdentifier("input")
                ),
                ts.factory.createIdentifier("id")
              ),
              ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx"),
                  ts.factory.createIdentifier("uuid")
                ),
                undefined,
                []
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("timestamp"),
            undefined,
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createNewExpression(ts.factory.createIdentifier("Date"), undefined, []),
                ts.factory.createIdentifier("toISOString")
              ),
              undefined,
              []
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("values"),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("args"),
                    ts.factory.createIdentifier("input")
                  )
                ),
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("id"),
                  ts.factory.createIdentifier("id")
                ),
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("createdAt"),
                  ts.factory.createBinaryExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier("args"),
                        ts.factory.createIdentifier("input")
                      ),
                      ts.factory.createIdentifier("createdAt")
                    ),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    ts.factory.createIdentifier("timestamp")
                  )
                ),
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("updatedAt"),
                  ts.factory.createBinaryExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier("args"),
                        ts.factory.createIdentifier("input")
                      ),
                      ts.factory.createIdentifier("updatedAt")
                    ),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    ts.factory.createIdentifier("timestamp")
                  )
                ),
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("__typename"),
                  ts.factory.createStringLiteral(descriptor.targetName)
                ),
              ],
              true
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createExpressionStatement(
      ts.factory.createAwaitExpression(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("ctx"),
              ts.factory.createIdentifier("db")
            ),
            ts.factory.createIdentifier("add")
          ),
          undefined,
          [ts.factory.createIdentifier("values")]
        )
      )
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("result"),
            undefined,
            undefined,
            ts.factory.createAwaitExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx.db"),
                  ts.factory.createIdentifier("get")
                ),
                undefined,
                [ts.factory.createIdentifier("id")]
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
  ];
}

export function initGetItem(descriptor: ResolverDescriptor) {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("result"),
          undefined,
          undefined,
          ts.factory.createAwaitExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("ctx.db"),
                ts.factory.createIdentifier("get")
              ),
              undefined,
              [
                keyValue(
                  Array.isArray(descriptor.operation.key)
                    ? descriptor.operation.key[0]
                    : descriptor.operation.key
                ),
              ]
            )
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export function initBulkGet() {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("result"),
          undefined,
          undefined,
          ts.factory.createAwaitExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx"),
                  ts.factory.createIdentifier("db")
                ),
                ts.factory.createIdentifier("bulkGet")
              ),
              undefined,
              [
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("source"),
                  ts.factory.createIdentifier("keys")
                ),
              ]
            )
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export function initUpdateItem() {
  return [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("id"),
            undefined,
            undefined,
            ts.factory.createPropertyAccessExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("args"),
                ts.factory.createIdentifier("input")
              ),
              ts.factory.createIdentifier("id")
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("updated"),
            undefined,
            undefined,
            ts.factory.createAwaitExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("ctx"),
                    ts.factory.createIdentifier("db")
                  ),
                  ts.factory.createIdentifier("update")
                ),
                undefined,
                [
                  ts.factory.createIdentifier("id"),
                  ts.factory.createObjectLiteralExpression(
                    [
                      ts.factory.createSpreadAssignment(
                        ts.factory.createPropertyAccessExpression(
                          ts.factory.createIdentifier("args"),
                          ts.factory.createIdentifier("input")
                        )
                      ),
                      ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("updatedAt"),
                        ts.factory.createBinaryExpression(
                          ts.factory.createPropertyAccessExpression(
                            ts.factory.createPropertyAccessExpression(
                              ts.factory.createIdentifier("args"),
                              ts.factory.createIdentifier("input")
                            ),
                            ts.factory.createIdentifier("updatedAt")
                          ),
                          ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                          ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                              ts.factory.createNewExpression(
                                ts.factory.createIdentifier("Date"),
                                undefined,
                                []
                              ),
                              ts.factory.createIdentifier("toISOString")
                            ),
                            undefined,
                            []
                          )
                        )
                      ),
                    ],
                    true
                  ),
                ]
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createIfStatement(
      ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        ts.factory.createIdentifier("updated")
      ),
      ts.factory.createBlock(
        [
          ts.factory.createThrowStatement(
            ts.factory.createNewExpression(ts.factory.createIdentifier("Error"), undefined, [
              ts.factory.createStringLiteral("Record to update not found"),
            ])
          ),
        ],
        true
      ),
      undefined
    ),
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("result"),
            undefined,
            undefined,
            ts.factory.createAwaitExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx.db"),
                  ts.factory.createIdentifier("get")
                ),
                undefined,
                [ts.factory.createIdentifier("id")]
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
  ];
}

export function initDeleteItem() {
  return [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier("record"),
            undefined,
            undefined,
            ts.factory.createAwaitExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("ctx"),
                    ts.factory.createIdentifier("db")
                  ),
                  ts.factory.createIdentifier("get")
                ),
                undefined,
                [
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("args"),
                    ts.factory.createIdentifier("id")
                  ),
                ]
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.factory.createIfStatement(
      ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        ts.factory.createIdentifier("record")
      ),
      ts.factory.createBlock(
        [
          ts.factory.createThrowStatement(
            ts.factory.createNewExpression(ts.factory.createIdentifier("Error"), undefined, [
              ts.factory.createStringLiteral("Record does not exists"),
            ])
          ),
        ],
        true
      ),
      undefined
    ),
    ts.factory.createExpressionStatement(
      ts.factory.createAwaitExpression(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("ctx"),
              ts.factory.createIdentifier("db")
            ),
            ts.factory.createIdentifier("delete")
          ),
          undefined,
          [
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("record"),
              ts.factory.createIdentifier("id")
            ),
          ]
        )
      )
    ),
  ];
}

export function formatConnectionResult(
  descriptor: ResolverDescriptor,
  ast: ts.Node[],
  identifier: string
) {
  addImport(
    ast,
    "@saapless/graphql-utils",
    ts.factory.createImportSpecifier(
      false,
      undefined,
      ts.factory.createIdentifier("formatConnection")
    )
  );

  const props: ts.ObjectLiteralElementLike[] = [];

  if (descriptor.isEdge) {
    props.push(
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("items"),
        ts.factory.createArrayLiteralExpression([], false)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("keys"),
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(identifier),
                ts.factory.createIdentifier("map")
              ),
              undefined,
              [
                ts.factory.createArrowFunction(
                  undefined,
                  undefined,
                  [
                    ts.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      ts.factory.createObjectBindingPattern([
                        ts.factory.createBindingElement(
                          undefined,
                          undefined,
                          ts.factory.createIdentifier("targetId"),
                          undefined
                        ),
                      ]),
                      undefined,
                      undefined,
                      undefined
                    ),
                  ],
                  undefined,
                  ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  ts.factory.createIdentifier("targetId")
                ),
              ]
            ),
            ts.factory.createIdentifier("filter")
          ),
          undefined,
          [ts.factory.createIdentifier("Boolean")]
        )
      )
    );
  } else {
    props.push(
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("items"),
        ts.factory.createIdentifier("result")
      )
    );
  }

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier("formatConnection"),
    undefined,
    [ts.factory.createObjectLiteralExpression(props)]
  );
}

export function formatEdgesResult(
  descriptor: ResolverDescriptor,
  ast: ts.Node[],
  identifier: string
) {
  addImport(
    ast,
    "@saapless/graphql-utils",
    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("formatEdges"))
  );

  return ts.factory.createCallExpression(ts.factory.createIdentifier("formatEdges"), undefined, [
    ts.factory.createIdentifier(identifier),
  ]);
}

export function formatEdgeResult(
  descriptor: ResolverDescriptor,
  ast: ts.Node[],
  identifier: string
) {
  addImport(
    ast,
    "@saapless/graphql-utils",
    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("formatEdge"))
  );

  return ts.factory.createCallExpression(ts.factory.createIdentifier("formatEdge"), undefined, [
    ts.factory.createIdentifier(identifier),
  ]);
}

export function formatResult(
  descriptor: ResolverDescriptor,
  ast: ts.Node[],
  identifier: string = "result"
) {
  switch (descriptor.returnType) {
    case "connection":
      return formatConnectionResult(descriptor, ast, identifier);
    case "edges":
      return formatEdgesResult(descriptor, ast, identifier);
    case "edge":
      return formatEdgeResult(descriptor, ast, identifier);
    case "result":
    default:
      return ts.factory.createIdentifier(identifier ?? "result");
  }
}

export function checkEarlyReturn(descriptor: ResolverDescriptor, isArray: boolean = false) {
  const propExists = ts.factory.createPropertyAccessChain(
    ts.factory.createIdentifier("source"),
    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
    ts.factory.createIdentifier(descriptor.fieldName)
  );

  return ts.factory.createIfStatement(
    isArray
      ? ts.factory.createBinaryExpression(
          propExists,
          ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
          ts.factory.createPropertyAccessChain(
            ts.factory.createPropertyAccessChain(
              ts.factory.createIdentifier("source"),
              undefined,
              ts.factory.createIdentifier(descriptor.fieldName)
            ),
            undefined,
            ts.factory.createIdentifier("length")
          )
        )
      : propExists,
    ts.factory.createBlock([
      ts.factory.createReturnStatement(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("source"),
          ts.factory.createIdentifier(descriptor.fieldName)
        )
      ),
    ])
  );
}
