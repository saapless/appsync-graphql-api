/* eslint-disable security/detect-object-injection */

import { FieldLoaderDescriptor, KeyValue, LoaderDescriptor } from "../utils/types";
import { PropertyValue, tc } from "../codegen";

export function formatValue(value: unknown): PropertyValue {
  if (typeof value === "string") {
    return tc.str(value);
  } else if (typeof value === "number") {
    return tc.num(value);
  } else if (typeof value === "boolean") {
    return tc.bool(value);
  } else if (Array.isArray(value)) {
    return tc.arr(...value.map((v) => formatValue(v)));
  } else if (value === null) {
    return tc.null();
  } else if (typeof value === "object") {
    return tc.obj(
      Object.entries(value).reduce(
        (agg, [n, v]) => {
          agg[n] = formatValue(v);
          return agg;
        },
        {} as Record<string, PropertyValue>
      )
    );
  } else {
    throw new Error("Invalid value");
  }
}

export function keyValue<T extends string | number>(obj: KeyValue<T>) {
  if (obj.ref) {
    // `ctx.source` is typed as optional in Context

    if (obj.ref.startsWith("source")) {
      obj.ref = obj.ref.replace("source", "source?");
    }

    return tc.chain("ctx", obj.ref);
  }
  if (obj.eq) return typeof obj.eq === "string" ? tc.str(obj.eq) : tc.num(obj.eq);
  throw new Error("Invalid key value");
}

export function isFieldLoader(descriptor: LoaderDescriptor): descriptor is FieldLoaderDescriptor {
  return Object.hasOwn(descriptor, "fieldName") && Object.hasOwn(descriptor, "typeName");
}
