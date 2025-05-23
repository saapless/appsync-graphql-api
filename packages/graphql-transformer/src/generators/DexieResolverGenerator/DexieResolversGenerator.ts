import ts from "typescript";
import { ResolverDescriptor, TransformerContext } from "../../context";
import { ObjectNode } from "../../definition";
import { addImport, TransformPluginExecutionError } from "../../utils";
import {
  checkEarlyReturn,
  filterQuery,
  formatResult,
  getQueryResult,
  initBulkGet,
  initCreateItem,
  initDeleteItem,
  initGetItem,
  initQuery,
  initUpdateItem,
  sortQuery,
} from "./utils";

const defaultIndexMappings = {
  bySourceId: "sourceId",
  byTargetId: "targetId",
  byTypename: "__typename",
};

export class DexieResolverGenerator {
  public readonly name = "DexieResolverGenerator";

  private readonly context: TransformerContext;
  private readonly _ast: ts.Node[] = [];
  private readonly _indexMappings: Record<string, string>;

  constructor(context: TransformerContext, ast: ts.Node[]) {
    this.context = context;
    this._ast = ast;
    this._indexMappings = defaultIndexMappings;
  }

  private _getOperationIndexName(operation: ResolverDescriptor["operation"]) {
    if (!operation.index) {
      return null;
    }

    if (Object.keys(this._indexMappings).includes(operation.index)) {
      return this._indexMappings[operation.index];
    }

    if (Object.values(this._indexMappings).includes(operation.index)) {
      return operation.index;
    }

    throw new TransformPluginExecutionError(
      this.name,
      `Index ${operation.index} not found in index mappings`
    );
  }

  private _getArgs(descriptor: ResolverDescriptor) {
    const isRootField = descriptor.typeName === "Query" || descriptor.typeName === "Mutation";
    const hasFieldArgs = (
      this.context.document.getNode(descriptor.typeName) as ObjectNode
    ).getField(descriptor.fieldName)?.arguments?.length;

    const args: ts.ParameterDeclaration[] = [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        isRootField ? ts.factory.createIdentifier("_") : ts.factory.createIdentifier("source")
      ),
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        hasFieldArgs
          ? ts.factory.createIdentifier("args")
          : isRootField
            ? ts.factory.createIdentifier("__")
            : ts.factory.createIdentifier("_")
      ),
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("ctx")
      ),
    ];

    return args;
  }

  private _getArrowFunction(params: ts.ParameterDeclaration[], body: ts.Block) {
    return ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      params,
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      body
    );
  }

  private _getEarlyReturn(descriptor: ResolverDescriptor) {
    const statements: ts.Statement[] = [];

    if (descriptor.checkEarlyReturn) {
      statements.push(checkEarlyReturn(descriptor, descriptor.returnType === "edges"));
    }

    return statements;
  }

  private _checkKeyNotNull(descriptor: ResolverDescriptor) {
    const statements: ts.Statement[] = [];

    if (descriptor.operation.key.ref) {
      statements.push(
        ts.factory.createIfStatement(
          ts.factory.createPrefixUnaryExpression(
            ts.SyntaxKind.ExclamationToken,
            ts.factory.createIdentifier(descriptor.operation.key.ref)
          ),
          ts.factory.createBlock([ts.factory.createReturnStatement(ts.factory.createNull())], true),
          undefined
        )
      );
    }

    return statements;
  }

  private _getItem(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [
        ...this._getEarlyReturn(descriptor),
        ...this._checkKeyNotNull(descriptor),
        ...initGetItem(descriptor),
        ts.factory.createReturnStatement(formatResult(descriptor, this._ast)),
      ],
      true
    );
  }

  private _batchGetItems(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [
        ...this._getEarlyReturn(descriptor),
        ...this._checkKeyNotNull(descriptor),
        initBulkGet(),
        ts.factory.createReturnStatement(formatResult(descriptor, this._ast)),
      ],
      true
    );
  }

  private _queryItems(descriptor: ResolverDescriptor): ts.Block {
    addImport(
      this._ast,
      "@saapless/graphql-utils",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("filterExpression")
      )
    );

    const block = [
      ...this._getEarlyReturn(descriptor),
      ...this._checkKeyNotNull(descriptor),
      initQuery(descriptor, this._getOperationIndexName(descriptor.operation)),
      filterQuery(),
      sortQuery(),
      getQueryResult(),
      ts.factory.createReturnStatement(formatResult(descriptor, this._ast)),
    ];

    return ts.factory.createBlock(block, true);
  }

  private _createItem(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [
        ...initCreateItem(descriptor),
        ts.factory.createReturnStatement(formatResult(descriptor, this._ast)),
      ],
      true
    );
  }

  private _updateItem(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [...initUpdateItem(), ts.factory.createReturnStatement(formatResult(descriptor, this._ast))],
      true
    );
  }

  private _upsertItem(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [ts.factory.createReturnStatement(formatResult(descriptor, this._ast))],
      true
    );
  }

  private _deleteItem(descriptor: ResolverDescriptor): ts.Block {
    return ts.factory.createBlock(
      [
        ...initDeleteItem(),
        ts.factory.createReturnStatement(formatResult(descriptor, this._ast, "record")),
      ],
      true
    );
  }

  private _getBody(descriptor: ResolverDescriptor): ts.Block {
    switch (descriptor.operation.type) {
      case "get":
        return this._getItem(descriptor);
      case "batchGet":
        return this._batchGetItems(descriptor);
      case "query":
        return this._queryItems(descriptor);
      case "create":
        return this._createItem(descriptor);
      case "update":
        return this._updateItem(descriptor);
      case "upsert":
        return this._upsertItem(descriptor);
      case "delete":
        return this._deleteItem(descriptor);
      default:
        throw new TransformPluginExecutionError(
          this.name,
          `Unknown action type: ${descriptor.operation.type}`
        );
    }
  }

  public generate(descriptor: ResolverDescriptor): ts.ArrowFunction {
    const params = this._getArgs(descriptor);
    const body = this._getBody(descriptor);
    return this._getArrowFunction(params, body);
  }
}
