import ts from "typescript";
import { TransformerContext } from "../context";
import { LoaderDescriptor } from "../utils/types";
import { pascalCase, TransformExecutionError } from "../utils";
import { GeneratorBase } from "./GeneratorBase";
import { isFieldLoader, isFunctionLoader } from "./utils";

export abstract class ResolverGeneratorBase extends GeneratorBase {
  constructor(context: TransformerContext) {
    super(context);
  }

  protected _setImport(from: string, specifier: ts.ImportSpecifier) {
    const index = this._definitions.findIndex(
      (d) =>
        ts.isImportDeclaration(d) &&
        ts.isStringLiteral(d.moduleSpecifier) &&
        d.moduleSpecifier.text === from
    );

    // eslint-disable-next-line security/detect-object-injection
    const current = index > -1 ? (this._definitions[index] as ts.ImportDeclaration) : undefined;

    if (current) {
      const result = ts.transform(current, [
        () => (node) => {
          let importClause = node.importClause;

          if (!importClause) {
            importClause = ts.factory.createImportClause(
              false,
              undefined,
              ts.factory.createNamedImports([specifier])
            );
          }

          if (!importClause.namedBindings) {
            importClause = ts.factory.updateImportClause(
              importClause,
              importClause.isTypeOnly,
              importClause.name,
              ts.factory.createNamedImports([specifier])
            );
          } else if (ts.isNamedImports(importClause.namedBindings)) {
            if (
              !importClause.namedBindings.elements.some(
                (i) => i.name.escapedText === specifier.name.escapedText
              )
            ) {
              importClause = ts.factory.updateImportClause(
                importClause,
                importClause!.isTypeOnly,
                importClause!.name,
                ts.factory.createNamedImports([...importClause.namedBindings.elements, specifier])
              );
            }
          }

          return ts.factory.updateImportDeclaration(
            current,
            current.modifiers,
            importClause,
            current.moduleSpecifier,
            current.attributes
          );
        },
      ]);

      this._definitions.splice(index, 1, result.transformed[0]);
    } else {
      this._definitions.push(
        ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamedImports([specifier])
          ),
          ts.factory.createStringLiteral(from)
        )
      );
    }
  }

  protected _getTableName(descriptor: LoaderDescriptor) {
    const dataSource = this._context.dataSources.getDataSource(descriptor.dataSource);

    if (dataSource.type !== "DYNAMO_DB") {
      throw new TransformExecutionError("Invalid data source type provided to batchGetItem.");
    }

    return dataSource.config.tableName;
  }

  protected _checkResponseError() {
    this._setImport(
      "@aws-appsync/utils",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("util"))
    );

    return ts.factory.createIfStatement(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("ctx"),
        ts.factory.createIdentifier("error")
      ),
      ts.factory.createBlock([
        ts.factory.createReturnStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("util"),
              ts.factory.createIdentifier("error")
            ),
            undefined,
            [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx"),
                  ts.factory.createIdentifier("error")
                ),
                ts.factory.createIdentifier("message")
              ),
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx"),
                  ts.factory.createIdentifier("error")
                ),
                ts.factory.createIdentifier("type")
              ),
            ]
          )
        ),
      ]),
      undefined
    );
  }

  protected _earlyReturn(fieldName: string) {
    this._setImport(
      "@aws-appsync/utils",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("runtime"))
    );

    return ts.factory.createIfStatement(
      ts.factory.createPropertyAccessChain(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("ctx"),
          ts.factory.createIdentifier("source")
        ),
        ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
        ts.factory.createIdentifier(fieldName)
      ),
      ts.factory.createBlock([
        ts.factory.createReturnStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("runtime"),
              ts.factory.createIdentifier("earlyReturn")
            ),
            undefined,
            [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("ctx"),
                  ts.factory.createIdentifier("source")
                ),
                ts.factory.createIdentifier(fieldName)
              ),
            ]
          )
        ),
      ])
    );
  }

  private _formatConnection(loader: LoaderDescriptor) {
    this._setImport(
      "@saapless/appsync-utils",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("formatConnection")
      )
    );

    return ts.factory.createCallExpression(
      ts.factory.createIdentifier("formatConnection"),
      undefined,
      [
        ts.factory.createObjectLiteralExpression(
          [
            ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("items"),
              loader.isEdge
                ? ts.factory.createArrayLiteralExpression([], false)
                : ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("ctx.result"),
                    ts.factory.createIdentifier("items")
                  )
            ),
            ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("prevToken"),
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("ctx.args"),
                ts.factory.createIdentifier("after")
              )
            ),
            ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("nextToken"),
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("ctx.result"),
                ts.factory.createIdentifier("nextToken")
              )
            ),
          ],
          true
        ),
      ]
    );
  }

  private _formatEdges(loader: LoaderDescriptor) {
    this._setImport(
      "@saapless/appsync-utils",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("formatEdges"))
    );

    let ref;

    if (loader.action.type === "queryItems") {
      ref = ts.factory.createIdentifier("ctx.result.items");
    } else if (loader.action.type === "batchGetItems") {
      ref = ts.factory.createElementAccessExpression(
        ts.factory.createIdentifier("ctx.result.data"),
        ts.factory.createStringLiteral(this._getTableName(loader))
      );
    } else {
      ref = ts.factory.createArrayLiteralExpression([ts.factory.createIdentifier("ctx.result")]);
    }
    return ts.factory.createCallExpression(ts.factory.createIdentifier("formatEdges"), undefined, [
      ref,
    ]);
  }

  private _formatEdge() {
    this._setImport(
      "@saapless/appsync-utils",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("formatEdge"))
    );

    return ts.factory.createCallExpression(ts.factory.createIdentifier("formatEdge"), undefined, [
      ts.factory.createIdentifier("ctx.result"),
    ]);
  }

  protected _formatResult(loader: LoaderDescriptor) {
    switch (loader.returnType) {
      case "connection":
        return this._formatConnection(loader);
      case "edges":
        return this._formatEdges(loader);
      case "edge":
        return this._formatEdge();
      case "result": {
        return ts.factory.createIdentifier("ctx.result");
      }
    }
  }

  protected _getContextTypeName(loader: LoaderDescriptor, type: "req" | "res") {
    if (isFieldLoader(loader)) {
      return pascalCase(loader.typeName, loader.fieldName, type, "context");
    } else if (isFunctionLoader(loader)) {
      return pascalCase(loader.name, type, "context");
    }

    throw new TransformExecutionError("Invalid loader.");
  }

  protected _getRequestReturnType(loader: LoaderDescriptor) {
    switch (loader.action.type) {
      case "getItem": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBGetItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBGetItemRequest");
      }
      case "putItem": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBPutItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBPutItemRequest");
      }
      case "updateItem": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBUpdateItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBUpdateItemRequest");
      }
      case "upsertItem": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBUpdateItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBUpdateItemRequest");
      }
      case "removeItem": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBDeleteItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBDeleteItemRequest");
      }
      case "queryItems": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBQueryRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBQueryRequest");
      }
      case "batchGetItems": {
        this._setImport(
          "@aws-appsync/utils",
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("DynamoDBBatchGetItemRequest")
          )
        );
        return ts.factory.createTypeReferenceNode("DynamoDBBatchGetItemRequest");
      }
    }
  }

  protected _getResponseReturnType(loader: LoaderDescriptor) {
    switch (loader.returnType) {
      case "connection": {
        const name = pascalCase(loader.returnTargetName ?? loader.targetName, "connection");
        this._setImport(
          "../schema-types",
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        );

        return ts.factory.createTypeReferenceNode(name);
      }
      case "edges": {
        const name = pascalCase(loader.targetName, "edge");
        this._setImport(
          "../schema-types",
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        );

        return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(name));
      }
      case "edge": {
        const name = pascalCase(loader.targetName, "edge");
        this._setImport(
          "../schema-types",
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        );

        return ts.factory.createTypeReferenceNode(name);
      }

      case "result": {
        const name = pascalCase(loader.targetName);
        this._setImport(
          "../schema-types",
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        );

        return ts.factory.createTypeReferenceNode(name);
      }
    }
  }

  protected _setRequestFunction(loader: LoaderDescriptor, block: ts.Block) {
    const ctx = this._getContextTypeName(loader, "req");
    this._setImport(
      "../resolver-types",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(ctx))
    );

    this._definitions.push(
      ts.factory.createFunctionDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        undefined,
        ts.factory.createIdentifier("request"),
        undefined,
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier("ctx"),
            undefined,
            ts.factory.createTypeReferenceNode(ctx)
          ),
        ],
        this._getRequestReturnType(loader),
        block
      )
    );
  }

  protected _setResponseFunction(loader: LoaderDescriptor, block: ts.Block) {
    const ctx = this._getContextTypeName(loader, "res");
    this._setImport(
      "../resolver-types",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(ctx))
    );

    this._definitions.push(
      ts.factory.createFunctionDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        undefined,
        ts.factory.createIdentifier("response"),
        undefined,
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier("ctx"),
            undefined,
            ts.factory.createTypeReferenceNode(ctx)
          ),
        ],
        this._getResponseReturnType(loader),
        block
      )
    );
  }

  protected _getFileName(loader: LoaderDescriptor) {
    if (isFieldLoader(loader)) {
      return `${loader.typeName}.${loader.fieldName}.ts`;
    } else if (isFunctionLoader(loader)) {
      return `${loader.name}.ts`;
    } else {
      throw new TransformExecutionError("Could not get filename from loader");
    }
  }

  public abstract generateTemplate(loader: LoaderDescriptor): string;
}
