import ts from "typescript";
import { TransformerContext } from "../context";
import { ObjectNode } from "../definition";
import { FieldLoaderDescriptor, keyValue, TransformPluginExecutionError } from "../utils";

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
        hasFieldArgs ? ts.factory.createIdentifier("args") : ts.factory.createIdentifier("__")
      ),
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("ctx")
      ),
    ];

    return args;
  }

  private _getItem(descriptor: FieldLoaderDescriptor) {
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

  private _generateBody(descriptor: FieldLoaderDescriptor) {
    switch (descriptor.action.type) {
      case "getItem":
        return this._getItem(descriptor);
      default:
        throw new TransformPluginExecutionError(
          this.name,
          `Unknown action type: ${descriptor.action.type}`
        );
    }
  }

  private _generateResolverFunction(params: ts.ParameterDeclaration[], body: ts.Block) {
    return ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      params,
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      body
    );
  }

  public generate(descriptor: FieldLoaderDescriptor): ts.ArrowFunction {
    const params = this._getArgs(descriptor);
    const body = this._generateBody(descriptor);

    return this._generateResolverFunction(params, body);
  }
}
