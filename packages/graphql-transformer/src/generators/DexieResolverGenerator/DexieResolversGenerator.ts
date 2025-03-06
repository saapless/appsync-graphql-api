import ts from "typescript";
import { TransformerContext } from "../../context";
import { ObjectNode } from "../../definition";
import { FieldLoaderDescriptor, TransformPluginExecutionError } from "../../utils";
import {
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

export class DexieResolverGenerator {
  private readonly context: TransformerContext;
  public readonly name = "DexieResolverGenerator";
  constructor(context: TransformerContext) {
    this.context = context;
  }

  private _getArgs(descriptor: FieldLoaderDescriptor) {
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

  private _getItem(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [initGetItem(), ts.factory.createReturnStatement(formatResult(descriptor))],
      true
    );
  }

  private _batchGetItems(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [initBulkGet(), ts.factory.createReturnStatement(formatResult(descriptor))],
      true
    );
  }

  private _queryItems(descriptor: FieldLoaderDescriptor): ts.Block {
    const block = [
      initQuery(descriptor),
      filterQuery(),
      sortQuery(),
      getQueryResult(),
      ts.factory.createReturnStatement(formatResult(descriptor)),
    ];

    return ts.factory.createBlock(block, true);
  }

  private _createItem(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [...initCreateItem(descriptor), ts.factory.createReturnStatement(formatResult(descriptor))],
      true
    );
  }

  private _updateItem(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [...initUpdateItem(), ts.factory.createReturnStatement(formatResult(descriptor))],
      true
    );
  }

  private _upsertItem(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [ts.factory.createReturnStatement(formatResult(descriptor))],
      true
    );
  }

  private _deleteItem(descriptor: FieldLoaderDescriptor): ts.Block {
    return ts.factory.createBlock(
      [...initDeleteItem(), ts.factory.createReturnStatement(formatResult(descriptor, "record"))],
      true
    );
  }

  private _getBody(descriptor: FieldLoaderDescriptor): ts.Block {
    switch (descriptor.action.type) {
      case "getItem":
        return this._getItem(descriptor);
      case "batchGetItems":
        return this._batchGetItems(descriptor);
      case "queryItems":
        return this._queryItems(descriptor);
      case "putItem":
        return this._createItem(descriptor);
      case "updateItem":
        return this._updateItem(descriptor);
      case "upsertItem":
        return this._upsertItem(descriptor);
      case "removeItem":
        return this._deleteItem(descriptor);
      default:
        throw new TransformPluginExecutionError(
          this.name,
          `Unknown action type: ${descriptor.action.type}`
        );
    }
  }

  public generate(descriptor: FieldLoaderDescriptor): ts.ArrowFunction {
    const params = this._getArgs(descriptor);
    const body = this._getBody(descriptor);
    return this._getArrowFunction(params, body);
  }
}
