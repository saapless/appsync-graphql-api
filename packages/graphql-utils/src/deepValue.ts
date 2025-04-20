export function getValue(obj: unknown, path: string) {
  return path.split(".").reduce<typeof obj | undefined>((acc, key) => {
    if (acc && typeof acc === "object" && Object.hasOwn(acc, key)) {
      return acc[key as keyof typeof acc];
    }
    return undefined;
  }, obj);
}
