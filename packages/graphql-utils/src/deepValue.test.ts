import { getValue } from "./deepValue";

describe("deepValue", () => {
  it("should return the value of a nested property", () => {
    const obj = { a: { b: { c: 42 } } };
    const result = getValue(obj, "a.b.c");
    expect(result).toBe(42);
  });

  it("should return undefined for non-existent properties", () => {
    const obj = { a: { b: { c: 42 } } };
    const result = getValue(obj, "a.b.d");
    expect(result).toBeUndefined();
  });

  it("should handle arrays correctly", () => {
    const obj = { a: [{ b: 1 }, { b: 2 }] };
    const result = getValue(obj, "a.1.b");
    expect(result).toBe(2);
  });

  it("should handle complex paths", () => {
    const obj = { a: [{ b: { c: [1, 2, 3] } }] };
    const result = getValue(obj, "a.0.b.c.1");
    expect(result).toBe(2);
  });
  it("should return undefined for invalid paths", () => {
    const obj = { a: { b: { c: 42 } } };
    const result = getValue(obj, "a.b.c.d");
    expect(result).toBeUndefined();
  });
  it("should return undefined for empty path", () => {
    const obj = { a: { b: { c: 42 } } };
    const result = getValue(obj, "");
    expect(result).toBeUndefined();
  });
  it("should return undefined for non-object root", () => {
    const obj = 42;
    const result = getValue(obj, "a.b.c");
    expect(result).toBeUndefined();
  });
  it("should return undefined for non-existent array index", () => {
    const obj = { a: [{ b: 1 }, { b: 2 }] };
    const result = getValue(obj, "a.2.b");
    expect(result).toBeUndefined();
  });
});
