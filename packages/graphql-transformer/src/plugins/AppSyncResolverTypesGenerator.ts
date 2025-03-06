import ts from "typescript";
import { TransformerContext, ResolverDescriptor } from "../context";
import { ObjectNode } from "../definition";
import { pascalCase, printDefinitions } from "../utils";
import { TransformerPluginBase } from "./PluginBase";

export class AppSyncResolverTypesGenerator extends TransformerPluginBase {
  private readonly _definitions: ts.Node[];

  constructor(context: TransformerContext) {
    super("ResolverTypesGenerator", context);

    this._definitions = [];
  }

  private _ddbDefaults() {
    this._definitions.push(
      // Query
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("DynamoDBQueryResult"),
        [
          ts.factory.createTypeParameterDeclaration(
            undefined,
            "T",
            ts.factory.createTypeReferenceNode("Key"),
            ts.factory.createTypeReferenceNode("Key")
          ),
        ],
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("items"),
            undefined,
            ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("T"))
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("nextToken"),
            undefined,
            ts.factory.createUnionTypeNode([
              ts.factory.createTypeReferenceNode("string"),
              ts.factory.createTypeReferenceNode("null"),
            ])
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("scannedCount"),
            undefined,
            ts.factory.createTypeReferenceNode("number")
          ),
        ])
      ),
      // TrasactionCancellationReason
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("TrasactionCancellationReason"),
        undefined,
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("type"),
            undefined,
            ts.factory.createTypeReferenceNode("string")
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("message"),
            undefined,
            ts.factory.createTypeReferenceNode("string")
          ),
        ])
      ),
      // Batch Result
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("DynamoDBBatchResult"),
        [
          ts.factory.createTypeParameterDeclaration(
            undefined,
            "T",
            ts.factory.createTypeReferenceNode("Key"),
            ts.factory.createTypeReferenceNode("Key")
          ),
        ],
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("data"),
            undefined,
            ts.factory.createTypeLiteralNode([
              ts.factory.createIndexSignature(
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("K"),
                    undefined,
                    ts.factory.createTypeReferenceNode("string")
                  ),
                ],
                ts.factory.createArrayTypeNode(
                  ts.factory.createUnionTypeNode([
                    ts.factory.createTypeReferenceNode("T"),
                    ts.factory.createTypeReferenceNode("null"),
                  ])
                )
              ),
            ])
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("unprocessedKeys"),
            undefined,
            ts.factory.createTypeLiteralNode([
              ts.factory.createIndexSignature(
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("K"),
                    undefined,
                    ts.factory.createTypeReferenceNode("string")
                  ),
                ],
                ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("Key"))
              ),
            ])
          ),
        ])
      ),
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("DynamoDBBatchGetItemRequest"),
        [
          ts.factory.createTypeParameterDeclaration(
            undefined,
            "T",
            ts.factory.createTypeReferenceNode("Key"),
            ts.factory.createTypeReferenceNode("Key")
          ),
        ],
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("operation"),
            undefined,
            ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral("BatchGetItem"))
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("tables"),
            undefined,
            ts.factory.createTypeLiteralNode([
              ts.factory.createIndexSignature(
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("K"),
                    undefined,
                    ts.factory.createTypeReferenceNode("string")
                  ),
                ],
                ts.factory.createTypeLiteralNode([
                  ts.factory.createPropertySignature(
                    undefined,
                    ts.factory.createIdentifier("keys"),
                    undefined,
                    ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("T"))
                  ),
                  ts.factory.createPropertySignature(
                    undefined,
                    ts.factory.createIdentifier("consistentRead"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createTypeReferenceNode("boolean")
                  ),
                  ts.factory.createPropertySignature(
                    undefined,
                    ts.factory.createIdentifier("projection"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createTypeReferenceNode("DynamoDBProjectionExpression")
                  ),
                ])
              ),
            ])
          ),
        ])
      ),
      // TransactGet
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("DynamoDBTransactGetResult"),
        [
          ts.factory.createTypeParameterDeclaration(
            undefined,
            "T",
            ts.factory.createTypeReferenceNode("Key"),
            ts.factory.createTypeReferenceNode("Key")
          ),
        ],
        ts.factory.createUnionTypeNode([
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("items"),
              undefined,
              ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("T"))
            ),
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("cancellationReasons"),
              undefined,
              ts.factory.createTypeReferenceNode("null")
            ),
          ]),
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("items"),
              undefined,
              ts.factory.createTypeReferenceNode("null")
            ),
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("cancellationReasons"),
              undefined,
              ts.factory.createArrayTypeNode(
                ts.factory.createTypeReferenceNode("TrasactionCancellationReason")
              )
            ),
          ]),
        ])
      ),
      // TransactWrite
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("DynamoDBTransactWriteResult"),
        undefined,
        ts.factory.createUnionTypeNode([
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("keys"),
              undefined,
              ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("Key"))
            ),
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("cancellationReasons"),
              undefined,
              ts.factory.createTypeReferenceNode("null")
            ),
          ]),
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("keys"),
              undefined,
              ts.factory.createTypeReferenceNode("null")
            ),
            ts.factory.createPropertySignature(
              undefined,
              ts.factory.createIdentifier("cancellationReasons"),
              undefined,
              ts.factory.createArrayTypeNode(
                ts.factory.createTypeReferenceNode("TrasactionCancellationReason")
              )
            ),
          ]),
        ])
      )
    );
  }

  private _defaults() {
    this._definitions.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          undefined,
          ts.factory.createNamedImports([
            ts.factory.createImportSpecifier(
              true,
              undefined,
              ts.factory.createIdentifier("Context")
            ),
            ts.factory.createImportSpecifier(
              true,
              undefined,
              ts.factory.createIdentifier("DynamoDBProjectionExpression")
            ),
          ])
        ),
        ts.factory.createStringLiteral("@aws-appsync/utils")
      ),
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          true,
          undefined,
          ts.factory.createNamespaceImport(ts.factory.createIdentifier("Schema"))
        ),
        ts.factory.createStringLiteral("./schema-types")
      ),
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("Key"),
        undefined,
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("id"),
            undefined,
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("string"))
          ),
        ])
      )
    );

    this._ddbDefaults();
  }

  private _args(loader: ResolverDescriptor) {
    const node = this.context.document.getNode(loader.typeName);

    if (node instanceof ObjectNode && Boolean(node.getField(loader.fieldName)?.arguments?.length)) {
      return ts.factory.createTypeReferenceNode(
        `Schema.${pascalCase(loader.typeName, loader.fieldName, "args")}`
      );
    }

    return ts.factory.createTypeReferenceNode("Record", [
      ts.factory.createTypeReferenceNode("string"),
      ts.factory.createTypeReferenceNode("unknown"),
    ]);
  }

  private _source(loader: ResolverDescriptor) {
    if (loader.typeName === "Query" || loader.typeName === "Mutation") {
      return ts.factory.createTypeReferenceNode("undefined");
    }

    return ts.factory.createTypeReferenceNode(`Schema.${loader.typeName}`);
  }

  private _result(loader: ResolverDescriptor) {
    switch (loader.operation.type) {
      case "get":
      case "create":
      case "update":
      case "upsert":
      case "delete":
        return ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`);
      case "query":
        return ts.factory.createTypeReferenceNode("DynamoDBQueryResult", [
          ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`),
        ]);
      case "batchGet":
        return ts.factory.createTypeReferenceNode("DynamoDBBatchResult", [
          ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`),
        ]);
      default:
        return ts.factory.createTypeReferenceNode("unknown");
    }
  }

  private _field(loader: ResolverDescriptor) {
    const args = this._args(loader);
    const source = this._source(loader);
    const result = this._result(loader);

    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(
          pascalCase(loader.typeName, loader.fieldName, "req", "context")
        ),
        undefined,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Context"), [
          // Args
          args,
          // Stash
          ts.factory.createTypeReferenceNode("Record", [
            ts.factory.createTypeReferenceNode("string"),
            ts.factory.createTypeReferenceNode("unknown"),
          ]),
          // Prev
          ts.factory.createTypeReferenceNode("undefined"),
          // Source
          source,
          // Result
          ts.factory.createTypeReferenceNode("undefined"),
        ])
      ),
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(
          pascalCase(loader.typeName, loader.fieldName, "res", "context")
        ),
        undefined,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Context"), [
          // Args
          args,
          // Stash
          ts.factory.createTypeReferenceNode("Record", [
            ts.factory.createTypeReferenceNode("string"),
            ts.factory.createTypeReferenceNode("unknown"),
          ]),
          // Prev
          ts.factory.createTypeReferenceNode("undefined"),
          // Source
          source,
          // Result
          result,
        ])
      )
    );
  }

  public match(): boolean {
    return false;
  }

  public execute() {}

  public generate() {
    this._defaults();

    for (const fieldLoader of this.context.resolvers.getAllLoaders()) {
      this._field(fieldLoader);
    }

    const result = printDefinitions(this._definitions, "resolver-types.ts");
    return this.context.printScript("resolver-types.ts", result);
  }

  public static create(context: TransformerContext) {
    return new AppSyncResolverTypesGenerator(context);
  }
}
