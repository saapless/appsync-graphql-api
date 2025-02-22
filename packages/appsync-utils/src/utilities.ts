/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function getVal<T = unknown>(obj: object, path: string): T | undefined {
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object") {
      return acc[key];
    }
    return undefined;
  }, obj as any);
}

export function setVal<T extends object, V = unknown>(obj: T, path: string, value: V): T {
  const keys = path.split(".");

  keys.slice(0, -1).reduce((acc, key, index) => {
    if (!Object.hasOwn(acc, key) || typeof acc[key] !== "object") {
      acc[key] = Number.isNaN(+keys[index + 1]) ? {} : [];
    }

    return acc[key];
  }, obj as any)[keys[keys.length - 1]] = value;

  return obj;
}
