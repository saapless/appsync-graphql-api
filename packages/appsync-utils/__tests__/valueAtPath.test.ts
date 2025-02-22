import { getVal, setVal } from "../src/utilities";

describe("valueAtPath utilities", () => {
  describe("getVal", () => {
    it("should return the value at the given path", () => {
      const obj = {
        a: {
          b: {
            c: 1,
          },
        },
      };
      const path = "a.b.c";
      const value = 1;
      expect(getVal(obj, path)).toEqual(value);
    });

    it("should handle array access", () => {
      const obj = {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      };
      expect(getVal(obj, "users.0.name")).toEqual("John");
      expect(getVal(obj, "users.1.age")).toEqual(25);
    });

    it("should return undefined for non-existent paths", () => {
      const obj = { a: { b: 1 } };
      expect(getVal(obj, "a.c")).toBeUndefined();
      expect(getVal(obj, "x.y.z")).toBeUndefined();
    });

    it("should handle null and undefined values", () => {
      const obj = {
        a: null,
        b: undefined,
        c: { d: null },
      };
      expect(getVal(obj, "a")).toBeNull();
      expect(getVal(obj, "b")).toBeUndefined();
      expect(getVal(obj, "c.d")).toBeNull();
      expect(getVal(obj, "a.x")).toBeUndefined();
    });
  });

  describe("setVal", () => {
    it("should set the value at the given path", () => {
      const obj = {
        a: {
          b: {
            c: 1,
          },
        },
      };
      const path = "a.b.c";
      const value = 2;
      const updated = setVal(obj, path, value);
      expect(updated.a.b.c).toEqual(value);
    });

    it("should handle array updates", () => {
      const obj = {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      };
      const updated = setVal(obj, "users.0.name", "Johnny");

      expect(updated.users[0].name).toEqual("Johnny");
      expect(updated.users[1]).toEqual({ name: "Jane", age: 25 });
    });

    it("should set value in array", () => {
      const obj = {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      };
      const updated = setVal(obj, "users.2", { name: "Johnny", age: 20 });
      expect(updated.users[2]).toEqual({ name: "Johnny", age: 20 });
    });

    it("should create intermediate objects if they don't exist", () => {
      const obj = { a: {} };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = setVal<any>(obj, "a.b.c", "value");
      expect(updated.a.b.c).toEqual("value");
    });

    it("should handle setting null and undefined values", () => {
      const obj = {
        a: {
          b: {
            c: "value",
          },
        },
      };
      const updatedWithNull = setVal(obj, "a.b.c", null);
      expect(updatedWithNull.a.b.c).toBeNull();

      const updatedWithUndefined = setVal(obj, "a.b.c", undefined);
      expect(updatedWithUndefined.a.b.c).toBeUndefined();
    });
  });
});
