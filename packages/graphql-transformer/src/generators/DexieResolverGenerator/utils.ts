import ts from "typescript";
import { addImport } from "../../utils";
import { KeyValue, ResolverDescriptor } from "../../context";

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

export function initQuery(descriptor: ResolverDescriptor) {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier("query"),
          undefined,
          undefined,
          ts.factory.createCallExpression(
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
                [ts.factory.createStringLiteral(descriptor.operation.index ?? ":id")]
              ),
              ts.factory.createIdentifier("eq")
            ),
            undefined,
            [ts.factory.createStringLiteral("Task")]
          )
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
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("ctx"),
                    ts.factory.createIdentifier("util")
                  ),
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
                  ts.factory.createIdentifier("db"),
                  ts.factory.createIdentifier("friends")
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

export function formatResult(descriptor: ResolverDescriptor, ast: ts.Node[], identifier?: string) {
  const props: ts.ObjectLiteralElementLike[] = [];

  if (descriptor.isEdge) {
    props.push(
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("items"),
        ts.factory.createArrayLiteralExpression([], false)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("keys"),
        ts.factory.createIdentifier("result")
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

  switch (descriptor.returnType) {
    case "connection": {
      addImport(
        ast,
        "@saapless/graphql-utils",
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier("formatConnection")
        )
      );
      return ts.factory.createCallExpression(
        ts.factory.createIdentifier("formatConnection"),
        undefined,
        [ts.factory.createObjectLiteralExpression(props)]
      );
    }
    case "result":
    default:
      return ts.factory.createIdentifier(identifier ?? "result");
  }
}
