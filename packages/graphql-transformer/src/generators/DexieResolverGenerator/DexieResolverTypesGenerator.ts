import ts from "typescript";
import { ResolverDescriptor, TransformerContext } from "../../context";
import { addImport, pascalCase, printDefinitions } from "../../utils";
import { InterfaceNode, ObjectNode } from "../../definition";

// export declare type GraphQLFieldResolver<
//   TSource,
//   TContext,
//   TArgs = any,
//   TResult = unknown,
// >
export class DexieResolverTypesGenerator {
  public readonly name = "DexieResolverGenerator";

  private readonly context: TransformerContext;
  private readonly _ast: ts.Node[] = [];

  constructor(context: TransformerContext) {
    this.context = context;
    this._ast = [];

    this._generateContext();
  }

  private _defaults() {
    this._ast.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          true,
          undefined,
          ts.factory.createNamespaceImport(ts.factory.createIdentifier("Schema"))
        ),
        ts.factory.createStringLiteral("../schema-types")
      ),
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          true,
          undefined,
          ts.factory.createNamedImports([
            ts.factory.createImportSpecifier(
              false,
              undefined,
              ts.factory.createIdentifier("GraphQLFieldResolver")
            ),
          ])
        ),
        ts.factory.createStringLiteral("graphql")
      )
    );
  }

  private _generateContext() {
    this._defaults();

    addImport(
      this._ast,
      "dexie",
      ts.factory.createImportSpecifier(true, undefined, ts.factory.createIdentifier("EntityTable"))
    );

    this._ast.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("RecordsDB"),
        undefined,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("EntityTable"), [
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Schema.Node"), undefined),
          ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral("id")),
        ])
      ),
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("ResolverContext"),
        undefined,
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("db"),
            undefined,
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("RecordsDB"), undefined)
          ),
          ts.factory.createMethodSignature(
            undefined,
            ts.factory.createIdentifier("uuid"),
            undefined,
            undefined,
            [],
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          ),
        ])
      ),
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("ReturnType"),
        [
          ts.factory.createTypeParameterDeclaration(
            undefined,
            ts.factory.createIdentifier("T"),
            undefined,
            undefined
          ),
        ],
        ts.factory.createUnionTypeNode([
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("T"), undefined),
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Promise"), [
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("T"), undefined),
          ]),
        ])
      )
    );
  }

  private _getArgsType(descriptor: ResolverDescriptor) {
    const node = this.context.document.getNode(descriptor.typeName);

    if (node instanceof ObjectNode || node instanceof InterfaceNode) {
      const field = node.fields?.find((f) => f.name === descriptor.fieldName);

      if (field) {
        const args = field.arguments;

        if (Array.isArray(args) && args.length > 0) {
          const argsName = pascalCase(descriptor.typeName, descriptor.fieldName, "args");
          return ts.factory.createTypeReferenceNode(`Schema.${argsName}`);
        }
      }
    }

    return ts.factory.createTypeReferenceNode("undefined");
  }

  private _getResultType(descriptor: ResolverDescriptor) {
    switch (descriptor.returnType) {
      case "connection": {
        const name = pascalCase(descriptor.targetName, "connection");
        return ts.factory.createTypeReferenceNode(`Schema.${name}`);
      }

      case "edges": {
        const name = pascalCase(descriptor.targetName, "edge");
        return ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(`Schema.${name}`));
      }
      case "edge": {
        const name = pascalCase(descriptor.targetName, "edge");
        return ts.factory.createTypeReferenceNode(`Schema.${name}`);
      }

      case "result":
        return ts.factory.createTypeReferenceNode(`Schema.${descriptor.targetName}`);
    }
  }

  public generate(descriptor: ResolverDescriptor) {
    this._ast.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(
          pascalCase(descriptor.typeName, descriptor.fieldName, "resolver")
        ),
        undefined,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("GraphQLFieldResolver"), [
          // Source
          descriptor.typeName === "Query" || descriptor.typeName === "Mutation"
            ? ts.factory.createTypeReferenceNode("undefined")
            : ts.factory.createTypeReferenceNode(`Schema.${descriptor.typeName}`),
          // Context
          ts.factory.createTypeReferenceNode("ResolverContext"),
          // Args
          this._getArgsType(descriptor),
          // Result
          ts.factory.createTypeReferenceNode("ReturnType", [
            this._getResultType(descriptor) ?? ts.factory.createTypeReferenceNode("unknown"),
          ]),
        ])
      )
    );
  }

  public print(filePath: string) {
    const result = printDefinitions(this._ast, `resolver-types.ts`);
    return this.context.printScript(filePath, result);
  }
}
