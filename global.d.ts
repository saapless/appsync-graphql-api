/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extract from T those types that has K keys  */
type ExtractByKey<T, K extends keyof any> = T extends infer R
  ? K extends keyof R
    ? R
    : never
  : never;

type KeyofUnion<T> = T extends infer R ? keyof R : never;

declare global {
  interface ObjectConstructor {
    /**
     * Determines whether an object has a property with the specified name.
     * @param o An object.
     * @param v A property name.
     */
    hasOwn<T extends Record<keyof any, any>, K extends KeyofUnion<T>>(
      o: T,
      v: K
    ): o is ExtractByKey<T, K>;
  }
}
