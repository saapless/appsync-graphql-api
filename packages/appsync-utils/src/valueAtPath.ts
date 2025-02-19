/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function getValueAtPath<T = unknown>(obj: object, path: string): T | undefined {
  return path.split(".").reduce<any>((acc, key) => {
    if (acc && typeof acc === "object") {
      return acc[key];
    }
    return undefined;
  }, obj);
}

export function setValueAtPath<T extends object, V = unknown>(obj: T, path: string, value: V): T {
  const keys = path.split(".");
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  const update = keys.slice(0, -1).reduce((acc, key, index) => {
    if (!Object.hasOwn(acc, key) || typeof acc[key] !== "object") {
      acc[key] = isNaN(Number(keys[index + 1])) ? {} : [];
    }

    return acc[key];
  }, newObj as any);

  update[keys[keys.length - 1]] = value;

  return obj;
}
