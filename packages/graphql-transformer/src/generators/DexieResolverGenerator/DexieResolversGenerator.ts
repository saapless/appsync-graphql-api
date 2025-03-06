import ts from "typescript";
import { TransformerContext } from "../../context";
import { ObjectNode } from "../../definition";
import { FieldLoaderDescriptor, keyValue, TransformPluginExecutionError } from "../../utils";

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
    const action = ts.factory.createReturnStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("ctx.db"),
          ts.factory.createIdentifier("get")
        ),
        undefined,
        [keyValue(descriptor.action.key["id"])]
      )
    );

    return ts.factory.createBlock([action], true);
  }

  private _batchGetItems(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
    );
  }

  private _queryItems(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
    );
  }

  private _createItem(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
    );
  }

  private _updateItem(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
    );
  }

  private _upsertItem(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
    );
  }

  private _deleteItem(descriptor: FieldLoaderDescriptor): ts.Block {
    throw new TransformPluginExecutionError(
      this.name,
      `${descriptor.action.type} not implemented yet`
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
