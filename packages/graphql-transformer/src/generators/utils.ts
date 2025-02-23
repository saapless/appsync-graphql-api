import ts from "typescript";
import {
  FieldLoaderDescriptor,
  Key,
  KeyValue,
  LoaderDescriptor,
  PipelineFunctionLoaderDescriptor,
} from "../utils/types";

export function formatValue(value: unknown): ts.Expression {
  if (typeof value === "string") {
    return ts.factory.createStringLiteral(value);
  } else if (typeof value === "number") {
    return ts.factory.createNumericLiteral(value);
  } else if (typeof value === "boolean") {
    return value === true ? ts.factory.createTrue() : ts.factory.createFalse();
  } else if (Array.isArray(value)) {
    return ts.factory.createArrayLiteralExpression(value.map((v) => formatValue(v)));
  } else if (value === null) {
    return ts.factory.createNull();
  } else if (typeof value === "object") {
    return ts.factory.createObjectLiteralExpression(
      Object.entries(value).reduce((agg, [n, v]) => {
        agg.push(
          ts.factory.createPropertyAssignment(ts.factory.createIdentifier(n), formatValue(v))
        );
        return agg;
      }, [] as ts.ObjectLiteralElementLike[])
    );
  } else {
    throw new Error("Invalid value");
  }
}

export function keyValue<T extends string | number>(obj: KeyValue<T>) {
  if (obj.ref) {
    // `ctx.source` is typed as optional in Context

    if (obj.ref.includes("source")) {
      obj.ref = obj.ref.replace("source", "source?");
    }

    if (obj.ref.startsWith("ctx")) {
      return ts.factory.createIdentifier(obj.ref);
    }

    return ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("ctx"),
      ts.factory.createIdentifier(obj.ref)
    );
  }

  if (obj.eq) {
    return typeof obj.eq === "string"
      ? ts.factory.createStringLiteral(obj.eq)
      : ts.factory.createNumericLiteral(obj.eq);
  }
  throw new Error("Invalid key value");
}

export function isFieldLoader(descriptor: LoaderDescriptor): descriptor is FieldLoaderDescriptor {
  return Object.hasOwn(descriptor, "fieldName") && Object.hasOwn(descriptor, "typeName");
}

export function isFunctionLoader(
  descriptor: LoaderDescriptor
): descriptor is PipelineFunctionLoaderDescriptor {
  return Object.hasOwn(descriptor, "name");
}

export function parseKey(key: Key) {
  return ts.factory.createObjectLiteralExpression(
    Object.entries(key).reduce((agg, [name, op]) => {
      if (op.ref || op.eq) {
        agg.push(
          ts.factory.createPropertyAssignment(ts.factory.createIdentifier(name), keyValue(op))
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
