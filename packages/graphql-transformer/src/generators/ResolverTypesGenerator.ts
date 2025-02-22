import ts from "typescript";
import { TransformerContext } from "../context";
import { FieldLoaderDescriptor, pascalCase } from "../utils";
import { ObjectNode } from "../definition";
import { GeneratorBase } from "./GeneratorBase";

export class ResolverTypesGenerator extends GeneratorBase {
  constructor(context: TransformerContext) {
    super(context);
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
      // Batch
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

  private _args(loader: FieldLoaderDescriptor) {
    const node = this._context.document.getNode(loader.typeName);

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

  private _source(loader: FieldLoaderDescriptor) {
    if (loader.typeName === "Query" || loader.typeName === "Mutation") {
      return ts.factory.createTypeReferenceNode("undefined");
    }

    return ts.factory.createTypeReferenceNode(`Schema.${loader.typeName}`);
  }

  private _result(loader: FieldLoaderDescriptor) {
    switch (loader.action.type) {
      case "getItem":
      case "putItem":
      case "updateItem":
      case "upsertItem":
      case "removeItem":
        return ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`);
      case "queryItems":
        return ts.factory.createTypeReferenceNode("DynamoDBQueryResult", [
          ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`),
        ]);
      case "batchGetItems":
        return ts.factory.createTypeReferenceNode("DynamoDBBatchResult", [
          ts.factory.createTypeReferenceNode(`Schema.${loader.targetName}`),
        ]);
      default:
        return ts.factory.createTypeReferenceNode("unknown");
    }
  }

  private _field(loader: FieldLoaderDescriptor) {
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

  // private _function(loader: PipelineFunctionLoaderDescriptor) {}

  public generate(filename: string): string {
    this._defaults();

    for (const fieldLoader of this._context.loader.getAllFieldLoaders()) {
      this._field(fieldLoader);
    }

    // TODO: enable if needed
    // for (const pipelineFunction of this._context.loader.getAllFunctionLoaders()) {
    //   this._function(pipelineFunction);
    // }

    return this._printDefinitions(filename);
  }
}
