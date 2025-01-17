/* eslint-disable security/detect-object-injection */

import { PropertyValue, tc } from "./ast";

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
