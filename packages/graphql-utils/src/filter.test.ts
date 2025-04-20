import { filterExpression } from "./filter";

describe("filterExpression", () => {
  it("evaluates against multiple records", () => {
    const filter = filterExpression({ status: { eq: "active" } });
    expect(filter([{ status: "active" }, { status: "inactive" }])).toBe(false);
  });

  it("evaluates against null", () => {
    expect(filterExpression({ status: { eq: "active" } })(null)).toBe(false);
  });

  describe("single record tests", () => {
    // Define a test record for individual operator tests
    const testRecord = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      age: 30,
      verified: true,
      tags: ["one", "two", "three"],
      profile: { experience: 5, role: "developer" },
    };

    // Comparison Operators
    describe("comparison operators", () => {
      it("should filter with equals (eq) operator", () => {
        expect(filterExpression({ age: { eq: 30 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { eq: 25 } })(testRecord)).toBe(false);
      });

      it("should filter with not equals (ne) operator", () => {
        expect(filterExpression({ age: { ne: 25 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { ne: 30 } })(testRecord)).toBe(false);
      });

      it("should filter with greater than (gt) operator", () => {
        expect(filterExpression({ age: { gt: 25 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { gt: 30 } })(testRecord)).toBe(false);
        expect(filterExpression({ age: { gt: 35 } })(testRecord)).toBe(false);
      });

      it("should filter with greater than or equals (ge) operator", () => {
        expect(filterExpression({ age: { ge: 30 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { ge: 25 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { ge: 35 } })(testRecord)).toBe(false);
      });

      it("should filter with less than (lt) operator", () => {
        expect(filterExpression({ age: { lt: 35 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { lt: 30 } })(testRecord)).toBe(false);
        expect(filterExpression({ age: { lt: 25 } })(testRecord)).toBe(false);
      });

      it("should filter with less than or equals (le) operator", () => {
        expect(filterExpression({ age: { le: 30 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { le: 35 } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { le: 25 } })(testRecord)).toBe(false);
        expect(filterExpression({ age: { le: "25" } })(testRecord)).toBe(false);
        expect(filterExpression({ "profile.role": { le: "developer" } })(testRecord)).toBe(true);
      });
    });

    // Function Operators
    describe("function operators", () => {
      it("should filter with in operator", () => {
        expect(filterExpression({ age: { in: [25, 30, 35] } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { in: [25, 35] } })(testRecord)).toBe(false);
      });

      it("should filter with between operator", () => {
        expect(filterExpression({ age: { between: [25, 35] } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { between: [31, 35] } })(testRecord)).toBe(false);
        expect(filterExpression({ age: { between: [20, 29] } })(testRecord)).toBe(false);
      });

      it("should filter with contains operator", () => {
        expect(filterExpression({ name: { contains: "Test" } })(testRecord)).toBe(true);
        expect(filterExpression({ name: { contains: "User" } })(testRecord)).toBe(true);
        expect(filterExpression({ name: { contains: "Admin" } })(testRecord)).toBe(false);
      });

      it("should filter with notContains operator", () => {
        expect(filterExpression({ name: { notContains: "Admin" } })(testRecord)).toBe(true);
        expect(filterExpression({ name: { notContains: "User" } })(testRecord)).toBe(false);
        expect(filterExpression({ tags: { notContains: "six" } })(testRecord)).toBe(true);
      });

      it("should filter with beginsWith operator", () => {
        expect(filterExpression({ name: { beginsWith: "Test" } })(testRecord)).toBe(true);
        expect(filterExpression({ name: { beginsWith: "User" } })(testRecord)).toBe(false);
      });

      it("should filter with attributeExists operator", () => {
        expect(filterExpression({ profile: { attributeExists: true } })(testRecord)).toBe(true);
        expect(filterExpression({ nonExistentField: { attributeExists: false } })(testRecord)).toBe(
          true
        );
        expect(filterExpression({ name: { attributeExists: false } })(testRecord)).toBe(false);
        expect(filterExpression({ nonExistentField: { attributeExists: true } })(testRecord)).toBe(
          false
        );
      });

      it("should filter with attributeType operator", () => {
        expect(filterExpression({ age: { attributeType: "number" } })(testRecord)).toBe(true);
        expect(filterExpression({ name: { attributeType: "string" } })(testRecord)).toBe(true);
        expect(filterExpression({ verified: { attributeType: "boolean" } })(testRecord)).toBe(true);
        expect(filterExpression({ tags: { attributeType: "object" } })(testRecord)).toBe(true);
        expect(filterExpression({ age: { attributeType: "string" } })(testRecord)).toBe(false);
      });

      it("should filter with size operator", () => {
        expect(filterExpression({ tags: { size: { eq: 3 } } })(testRecord)).toBe(true);
        expect(filterExpression({ tags: { size: { gt: 2 } } })(testRecord)).toBe(true);
        expect(filterExpression({ tags: { size: { lt: 4 } } })(testRecord)).toBe(true);
        expect(filterExpression({ tags: { size: { between: [2, 4] } } })(testRecord)).toBe(true);
        expect(filterExpression({ tags: { size: { eq: 2 } } })(testRecord)).toBe(false);
      });
    });

    // Logical Operators
    describe("logical operators", () => {
      it("should filter with AND logic", () => {
        expect(
          filterExpression({
            and: [{ age: { gt: 25 } }, { name: { contains: "User" } }],
          })(testRecord)
        ).toBe(true);

        expect(
          filterExpression({
            and: [{ age: { gt: 25 } }, { name: { contains: "Admin" } }],
          })(testRecord)
        ).toBe(false);
      });

      it("should filter with OR logic", () => {
        expect(
          filterExpression({
            or: [{ age: { gt: 35 } }, { name: { contains: "User" } }],
          })(testRecord)
        ).toBe(true);

        expect(
          filterExpression({
            or: [{ age: { gt: 35 } }, { name: { contains: "Admin" } }],
          })(testRecord)
        ).toBe(false);
      });

      it("should filter with NOT logic", () => {
        expect(
          filterExpression({
            not: { age: { lt: 30 } },
          })(testRecord)
        ).toBe(true);

        expect(
          filterExpression({
            not: { age: { gt: 25 } },
          })(testRecord)
        ).toBe(false);
      });

      it("should handle complex nested logical operators", () => {
        expect(
          filterExpression({
            and: [
              { age: { between: [25, 35] } },
              {
                or: [{ name: { beginsWith: "Test" } }, { verified: { eq: false } }],
              },
            ],
          })(testRecord)
        ).toBe(true);

        expect(
          filterExpression({
            and: [
              { age: { between: [25, 35] } },
              {
                not: {
                  or: [{ name: { beginsWith: "Test" } }, { verified: { eq: false } }],
                },
              },
            ],
          })(testRecord)
        ).toBe(false);
      });
    });

    // Edge cases
    describe("edge cases", () => {
      it("should handle non-existent fields", () => {
        expect(filterExpression({ nonExistent: { eq: "anything" } })(testRecord)).toBe(false);
      });

      it("should handle multiple conditions on the same record", () => {
        expect(
          filterExpression({
            age: { gt: 25 },
            name: { contains: "User" },
            verified: { eq: true },
          })(testRecord)
        ).toBe(true);

        expect(
          filterExpression({
            age: { gt: 25 },
            name: { contains: "User" },
            verified: { eq: false },
          })(testRecord)
        ).toBe(false);
      });

      it("should handle nested fields", () => {
        expect(
          filterExpression({ "profile.role": { eq: "developer" } })({ "profile.role": "developer" })
        ).toBe(true);
      });
    });
  });

  // Array filtering tests
  describe("array filtering", () => {
    const records = [
      { id: 1, name: "Alice", age: 30, status: "active", tags: ["developer", "frontend"] },
      { id: 2, name: "Bob", age: 25, status: "active", tags: ["designer"] },
      { id: 3, name: "Charlie", age: 35, status: "inactive", tags: ["developer", "backend"] },
      { id: 4, name: "Diana", age: 28, status: "active", tags: ["manager", "frontend"] },
      {
        id: 5,
        name: "Eve",
        age: 42,
        status: "inactive",
        tags: ["developer", "backend", "manager"],
      },
    ];

    it("should filter arrays with simple field conditions", () => {
      const activeRecords = records.filter(filterExpression({ status: { eq: "active" } }));
      expect(activeRecords.length).toBe(3);
      expect(activeRecords.map((r) => r.id)).toEqual([1, 2, 4]);

      const olderThan30 = records.filter(filterExpression({ age: { gt: 30 } }));
      expect(olderThan30.length).toBe(2);
      expect(olderThan30.map((r) => r.name)).toEqual(["Charlie", "Eve"]);
    });

    it("should filter arrays with logical operators", () => {
      // Active developers
      const activeDevelopers = records.filter(
        filterExpression({
          and: [{ status: { eq: "active" } }, { tags: { contains: "developer" } }],
        })
      );
      expect(activeDevelopers.length).toBe(1);
      expect(activeDevelopers[0].name).toBe("Alice");

      // Active or managers
      const activeOrManagers = records.filter(
        filterExpression({
          or: [{ status: { eq: "active" } }, { tags: { contains: "manager" } }],
        })
      );
      expect(activeOrManagers.length).toBe(4);
      expect(activeOrManagers.map((r) => r.id).sort()).toEqual([1, 2, 4, 5]);
    });

    it("should filter arrays with complex nested conditions", () => {
      // Active frontend developers or inactive backend developers
      const complexFilter = records.filter(
        filterExpression({
          or: [
            {
              and: [
                { status: { eq: "active" } },
                { tags: { contains: "frontend" } },
                { tags: { contains: "developer" } },
              ],
            },
            {
              and: [{ status: { eq: "inactive" } }, { tags: { contains: "backend" } }],
            },
          ],
        })
      );

      expect(complexFilter.length).toBe(3);
      expect(complexFilter.map((r) => r.name).sort()).toEqual(["Alice", "Charlie", "Eve"]);
    });

    it("should handle array filtering with size operators", () => {
      // Records with exactly one tag
      const singleTagRecords = records.filter(
        filterExpression({
          tags: { size: { eq: 1 } },
        })
      );
      expect(singleTagRecords.length).toBe(1);
      expect(singleTagRecords[0].name).toBe("Bob");

      // Records with more than one tag
      const multiTagRecords = records.filter(
        filterExpression({
          tags: { size: { gt: 1 } },
        })
      );
      expect(multiTagRecords.length).toBe(4);
      expect(multiTagRecords.map((r) => r.id).sort()).toEqual([1, 3, 4, 5]);
    });
  });

  // Type mismatch edge cases
  describe("type mismatch edge cases", () => {
    it("should handle number vs string mismatches", () => {
      // Record with string values that look like numbers
      const stringifiedRecord = {
        id: "123",
        quantity: "42",
        price: "19.99",
        code: "007",
      };

      // Filtering with numeric expressions
      expect(filterExpression({ id: { eq: 123 } })(stringifiedRecord)).toBe(false); // strict equality
      expect(filterExpression({ quantity: { gt: 30 } })(stringifiedRecord)).toBe(false); // string comparison
      expect(filterExpression({ price: { lt: 20 } })(stringifiedRecord)).toBe(false); // string comparison

      // Record with numeric values
      const numericRecord = {
        id: 123,
        quantity: 42,
        price: 19.99,
        code: 7,
      };

      // Filtering with string expressions
      expect(filterExpression({ id: { eq: "123" } })(numericRecord)).toBe(false); // strict equality
      expect(filterExpression({ code: { eq: "007" } })(numericRecord)).toBe(false); // string vs number
    });

    it("should handle boolean vs string/number mismatches", () => {
      const mixedTypesRecord = {
        isActive: true,
        enabled: "true",
        status: 1,
        flag: "yes",
      };

      // Boolean expressions
      expect(filterExpression({ isActive: { eq: true } })(mixedTypesRecord)).toBe(true);
      expect(filterExpression({ enabled: { eq: true } })(mixedTypesRecord)).toBe(false); // string "true" != boolean true
      expect(filterExpression({ status: { eq: true } })(mixedTypesRecord)).toBe(false); // number 1 != boolean true
      expect(filterExpression({ flag: { eq: true } })(mixedTypesRecord)).toBe(false); // string "yes" != boolean true
    });

    it("should handle null/undefined comparisons", () => {
      const recordWithNulls = {
        id: 123,
        name: "Test",
        description: null,
        metadata: undefined,
      };

      expect(filterExpression({ description: { eq: null } })(recordWithNulls)).toBe(true);
      expect(filterExpression({ metadata: { eq: undefined } })(recordWithNulls)).toBe(true);
      expect(filterExpression({ description: { eq: "null" } })(recordWithNulls)).toBe(false); // null != "null" string
      expect(filterExpression({ nonExistent: { eq: undefined } })(recordWithNulls)).toBe(true); // nonExistent property is undefined
    });

    it("should handle array vs primitive mismatches", () => {
      const mixedRecord = {
        tags: ["red", "green", "blue"],
        category: "colors",
        counts: [1, 2, 3],
        total: 6,
      };

      // Array methods on non-arrays
      expect(filterExpression({ category: { contains: "col" } })(mixedRecord)).toBe(true);
      // strings support contains
      expect(filterExpression({ total: { contains: "6" } })(mixedRecord)).toBe(false); // numbers don't support contains

      // Array vs non-array
      expect(filterExpression({ tags: { eq: "red" } })(mixedRecord)).toBe(false); // array != string
      expect(filterExpression({ counts: { eq: 6 } })(mixedRecord)).toBe(false); // array != number
    });

    it("should handle type coercion in comparisons", () => {
      const record = {
        strNum: "42",
        numVal: 42,
        mixedArray: ["1", 2, "3"],
      };

      // In some cases, the string representation might match in comparisons
      expect(filterExpression({ strNum: { beginsWith: "4" } })(record)).toBe(true);
      expect(filterExpression({ numVal: { beginsWith: "4" } })(record)).toBe(false);
      // Array contains with mixed types
      expect(filterExpression({ mixedArray: { contains: "2" } })(record)).toBe(false);
    });
  });

  // Advanced type safety tests
  describe("advanced type safety tests", () => {
    it("should properly enforce type matching for comparison operators", () => {
      const record = {
        numId: 123,
        strId: "123",
        date: new Date("2025-04-20"),
        timestamp: 1713628800000, // 2025-04-20 in milliseconds
      };

      // Numeric comparisons - should only work when both sides are numbers
      expect(filterExpression({ numId: { gt: 100 } })(record)).toBe(true);
      expect(filterExpression({ numId: { gt: "100" } })(record)).toBe(false); // number vs string

      // String comparisons - should only work when both sides are strings
      expect(filterExpression({ strId: { gt: "100" } })(record)).toBe(true);
      expect(filterExpression({ strId: { gt: 100 } })(record)).toBe(false); // string vs number

      // Date comparison - using timestamp
      expect(filterExpression({ timestamp: { gt: 1713542400000 } })(record)).toBe(true); // comparison works
      expect(filterExpression({ timestamp: { gt: "2025-04-19" } })(record)).toBe(false); // number vs string

      // Date object comparisons (these might fail because Date objects aren't directly comparable)
      expect(filterExpression({ date: { eq: new Date("2025-04-20") } })(record)).toBe(false); // Date objects are compared by reference
    });

    it("should handle array of objects and nested filtering", () => {
      const recordWithArrayOfObjects = {
        id: "item1",
        name: "Test Item",
        tags: ["important", "featured"],
        reviews: [
          { rating: 5, user: "user1", verified: true },
          { rating: 3, user: "user2", verified: false },
          { rating: 4, user: "user3", verified: true },
        ],
      };

      // Direct array containment tests
      expect(filterExpression({ tags: { contains: "important" } })(recordWithArrayOfObjects)).toBe(
        true
      );

      // Array size operators
      expect(filterExpression({ reviews: { size: { eq: 3 } } })(recordWithArrayOfObjects)).toBe(
        true
      );
      expect(filterExpression({ reviews: { size: { gt: 5 } } })(recordWithArrayOfObjects)).toBe(
        false
      );
      expect(
        filterExpression({ "reviews.0.verified": { eq: false } })(recordWithArrayOfObjects)
      ).toBe(false);

      // Cannot directly filter objects within arrays with the current implementation
      // A real-world implementation might support something like:
      // filterExpression({ "reviews[*].rating": { gt: 3 } })(recordWithArrayOfObjects)
    });

    it("should handle different record shapes and optional fields", () => {
      // Testing with different record shapes in an array
      const mixedRecords = [
        { id: 1, type: "user", name: "Alice" },
        { id: 2, type: "user", name: "Bob", metadata: { role: "admin" } },
        { id: 3, type: "product", title: "Widget", price: 9.99 },
        { id: 4, type: "product", title: "Gadget" }, // No price field
      ];

      // Filter by record type
      const users = mixedRecords.filter(filterExpression({ type: { eq: "user" } }));
      expect(users.length).toBe(2);
      expect(users.map((u) => u.id)).toEqual([1, 2]);

      // Filter with attributeExists for optional fields
      const productsWithPrice = mixedRecords.filter(
        filterExpression({
          type: { eq: "product" },
          price: { attributeExists: true },
        })
      );
      expect(productsWithPrice.length).toBe(1);
      expect(productsWithPrice[0].id).toBe(3);

      // Filter with nested optional fields
      const admins = mixedRecords.filter(
        filterExpression({
          type: { eq: "user" },
          "metadata.role": { eq: "admin" },
        })
      );

      expect(admins.length).toBe(1);
    });

    it("should handle complex date and time comparison scenarios", () => {
      const today = new Date("2025-04-20");
      const yesterday = new Date("2025-04-19");
      const tomorrow = new Date("2025-04-21");

      const events = [
        { id: "evt1", name: "Past Event", date: yesterday.getTime(), active: false },
        { id: "evt2", name: "Today's Event", date: today.getTime(), active: true },
        { id: "evt3", name: "Future Event", date: tomorrow.getTime(), active: true },
        { id: "evt4", name: "Undated Event", active: false },
      ];

      // Find active events happening today or later
      const upcomingActiveEvents = events.filter(
        filterExpression({
          and: [{ active: { eq: true } }, { date: { ge: today.getTime() } }],
        })
      );
      expect(upcomingActiveEvents.length).toBe(2);
      expect(upcomingActiveEvents.map((e) => e.id).sort()).toEqual(["evt2", "evt3"]);

      // Find events without a date
      const undatedEvents = events.filter(
        filterExpression({
          date: { attributeExists: false },
        })
      );
      expect(undatedEvents.length).toBe(1);
      expect(undatedEvents[0].id).toBe("evt4");

      // Find events between two dates
      const eventsInRange = events.filter(
        filterExpression({
          date: { between: [yesterday.getTime(), today.getTime()] },
        })
      );
      expect(eventsInRange.length).toBe(2);
      expect(eventsInRange.map((e) => e.id).sort()).toEqual(["evt1", "evt2"]);
    });

    it("should handle special case sensitivity in string operations", () => {
      const stringRecord = {
        name: "John Smith",
        email: "john.smith@example.com",
        username: "JohnS123",
        description: null,
      };

      // Case sensitive by default
      expect(filterExpression({ name: { contains: "john" } })(stringRecord)).toBe(false); // case sensitive
      expect(filterExpression({ name: { contains: "John" } })(stringRecord)).toBe(true);

      expect(filterExpression({ username: { beginsWith: "johns" } })(stringRecord)).toBe(false); // case sensitive
      expect(filterExpression({ username: { beginsWith: "JohnS" } })(stringRecord)).toBe(true);

      // Manual case insensitive check (would need custom implementation)
      const caseInsensitiveContains = (value: unknown, searchStr: string) => {
        if (typeof value !== "string") return false;
        return value.toLowerCase().includes(searchStr.toLowerCase());
      };

      expect(caseInsensitiveContains(stringRecord.name, "john")).toBe(true);

      // Handling null in string operations
      expect(filterExpression({ description: { contains: "any" } })(stringRecord)).toBe(false);
      expect(filterExpression({ description: { beginsWith: "any" } })(stringRecord)).toBe(false);
    });
  });

  // Tests that apply the same filter to different record versions
  describe("same filter against different record versions", () => {
    describe("complex filter with age and status conditions", () => {
      // Define a complex filter to be tested against multiple record variants
      const complexFilter = filterExpression({
        and: [
          { age: { ge: 30 } },
          { status: { eq: "active" } },
          {
            or: [{ role: { eq: "admin" } }, { permissions: { contains: "write" } }],
          },
        ],
      });

      it("should correctly evaluate records with valid matching fields", () => {
        // Complete record with all required fields that matches the filter
        const validRecord = {
          id: 1,
          name: "Alice",
          age: 35,
          status: "active",
          role: "admin",
          permissions: ["read", "write", "delete"],
          department: "Engineering",
        };
        expect(complexFilter(validRecord)).toBe(true);

        // Record that matches via permissions rather than role
        const alternatePathRecord = {
          id: 2,
          name: "Bob",
          age: 32,
          status: "active",
          role: "user",
          permissions: ["read", "write"],
          department: "Marketing",
        };
        expect(complexFilter(alternatePathRecord)).toBe(true);
      });

      it("should reject records missing required fields", () => {
        // Record missing age field
        const missingAgeRecord = {
          id: 3,
          name: "Charlie",
          status: "active",
          role: "admin",
          permissions: ["read", "write"],
          department: "Sales",
        };
        expect(complexFilter(missingAgeRecord)).toBe(false);

        // Record missing status field
        const missingStatusRecord = {
          id: 4,
          name: "Diana",
          age: 40,
          role: "admin",
          permissions: ["read", "write", "delete"],
          department: "Finance",
        };
        expect(complexFilter(missingStatusRecord)).toBe(false);

        // Record missing both role and permissions fields
        const missingRoleAndPermissionsRecord = {
          id: 5,
          name: "Eve",
          age: 45,
          status: "active",
          department: "HR",
        };
        expect(complexFilter(missingRoleAndPermissionsRecord)).toBe(false);
      });

      it("should reject records with wrong field types", () => {
        // Record with string instead of number for age
        const stringAgeRecord = {
          id: 6,
          name: "Frank",
          age: "33", // string instead of number
          status: "active",
          role: "admin",
          permissions: ["read", "write"],
          department: "Legal",
        };
        expect(complexFilter(stringAgeRecord)).toBe(false);

        // Record with number instead of string for status
        const numberStatusRecord = {
          id: 7,
          name: "Grace",
          age: 36,
          status: 1, // number instead of string
          role: "admin",
          permissions: ["read", "write"],
          department: "IT",
        };
        expect(complexFilter(numberStatusRecord)).toBe(false);

        // Record with string instead of array for permissions
        // Both string and array should be accepted
        const stringPermissionsRecord = {
          id: 8,
          name: "Hank",
          age: 38,
          status: "active",
          role: "user",
          permissions: "read,write", // string instead of array
          department: "Support",
        };
        expect(complexFilter(stringPermissionsRecord)).toBe(true);
      });

      it("should handle nested fields and additional properties properly", () => {
        // Record with nested objects
        const nestedRecord = {
          id: 9,
          name: "Irene",
          profile: {
            age: 40,
            status: "active",
          },
          security: {
            role: "admin",
            permissions: ["read", "write", "delete"],
          },
          department: "Executive",
        };
        // Does not match because fields are nested
        expect(complexFilter(nestedRecord)).toBe(false);

        // Record with extra fields that don't affect the filter
        const extraFieldsRecord = {
          id: 10,
          name: "Jack",
          age: 45,
          status: "active",
          role: "admin",
          permissions: ["read", "write"],
          salary: 100000,
          startDate: new Date("2020-01-01"),
          tags: ["senior", "remote"],
          address: {
            street: "123 Main St",
            city: "Anytown",
            zipCode: "12345",
          },
        };
        // Extra fields don't affect the result
        expect(complexFilter(extraFieldsRecord)).toBe(true);
      });
    });

    describe("string operations filter against different value types", () => {
      // Filter for testing string operations
      const stringFilter = filterExpression({
        and: [
          { name: { contains: "Smith" } },
          { email: { beginsWith: "john" } },
          { "address.city": { contains: "York" } },
        ],
      });

      it("should match record with proper string fields", () => {
        const properRecord = {
          name: "John Smith",
          email: "john.smith@example.com",
          address: { city: "New York", zip: "10001" },
        };
        expect(stringFilter(properRecord)).toBe(true);
      });

      it("should handle different data types for string operations", () => {
        // Number values for string fields
        const numberValuesRecord = {
          name: 12345, // number instead of string
          email: "john.doe@example.com",
          address: { city: "New York", zip: "10001" },
        };
        expect(stringFilter(numberValuesRecord)).toBe(false);

        // Null/undefined values for string fields
        const nullValuesRecord = {
          name: "Jane Smith",
          email: null, // null instead of string
          address: { city: "New York", zip: "10001" },
        };
        expect(stringFilter(nullValuesRecord)).toBe(false);

        // Array values for string fields
        // Both string and array should be accepted
        // String can be checked with contains
        const arrayValuesRecord = {
          name: ["John", "Smith"], // array instead of string
          email: "john.smith@example.com",
          address: { city: "New York", zip: "10001" },
        };
        expect(stringFilter(arrayValuesRecord)).toBe(true);
      });

      it("should handle flattened vs nested object paths", () => {
        // Flattened path notation
        const flattenedPathRecord = {
          name: "John Smith",
          email: "john.smith@example.com",
          "address.city": "New York", // flattened path instead of nested
          address: { street: "123 Main St" }, // doesn't have city
        };
        expect(stringFilter(flattenedPathRecord)).toBe(true);

        // Missing nested path
        const missingNestedPathRecord = {
          name: "John Smith",
          email: "john.smith@example.com",
          // address.city path doesn't exist
        };
        expect(stringFilter(missingNestedPathRecord)).toBe(false);
      });
    });

    describe("numeric comparison filter against different record versions", () => {
      // Filter with numeric comparisons
      const numericFilter = filterExpression({
        and: [{ age: { ge: 21 } }, { price: { lt: 100 } }, { quantity: { between: [5, 20] } }],
      });

      it("should match record with proper numeric fields", () => {
        const properRecord = {
          age: 25,
          price: 49.99,
          quantity: 10,
        };
        expect(numericFilter(properRecord)).toBe(true);
      });

      it("should handle string representations of numbers", () => {
        // Strings that look like numbers
        const stringNumbersRecord = {
          age: "25", // string instead of number
          price: "49.99", // string instead of number
          quantity: "10", // string instead of number
        };
        // String numbers should not match numeric comparisons in type-safe implementation
        expect(numericFilter(stringNumbersRecord)).toBe(false);
      });

      it("should handle mixed numeric types", () => {
        // Integer vs Float
        const mixedNumericTypesRecord = {
          age: 25, // integer
          price: 49, // integer instead of float
          quantity: 10.5, // float instead of integer
        };
        expect(numericFilter(mixedNumericTypesRecord)).toBe(true);

        // Edge cases at boundaries
        const boundaryValuesRecord = {
          age: 21, // exactly at lower bound
          price: 99.99, // just under upper bound
          quantity: 5, // exactly at lower bound
        };
        expect(numericFilter(boundaryValuesRecord)).toBe(true);
      });

      it("should reject out-of-range values", () => {
        // Values outside the filter ranges
        const outOfRangeRecord = {
          age: 20, // too young
          price: 49.99,
          quantity: 10,
        };
        expect(numericFilter(outOfRangeRecord)).toBe(false);

        const expensiveRecord = {
          age: 25,
          price: 100.0, // exactly at upper bound (lt, not le)
          quantity: 10,
        };
        expect(numericFilter(expensiveRecord)).toBe(false);

        const lowQuantityRecord = {
          age: 25,
          price: 49.99,
          quantity: 4, // too low
        };
        expect(numericFilter(lowQuantityRecord)).toBe(false);

        const highQuantityRecord = {
          age: 25,
          price: 49.99,
          quantity: 21, // too high
        };
        expect(numericFilter(highQuantityRecord)).toBe(false);
      });
    });

    describe("array operation filter against different record versions", () => {
      // Filter that operates on arrays
      const arrayFilter = filterExpression({
        and: [
          { tags: { contains: "premium" } },
          { categories: { size: { gt: 2 } } },
          { versions: { in: ["v1", "v2", "v3"] } },
        ],
      });

      it("should match record with proper array fields", () => {
        const properRecord = {
          tags: ["standard", "premium", "featured"],
          categories: ["electronics", "computers", "accessories", "office"],
          versions: "v2",
        };
        expect(arrayFilter(properRecord)).toBe(true);
      });

      it("should handle non-array values for array operations", () => {
        // String instead of array for tags
        const stringTagsRecord = {
          tags: "standard premium featured", // string instead of array
          categories: ["electronics", "computers", "accessories"],
          versions: "v2",
        };
        // String can be checked with contains
        expect(arrayFilter(stringTagsRecord)).toBe(true);

        // Null/undefined values
        const nullCategoriesRecord = {
          tags: ["standard", "premium"],
          categories: null, // null instead of array
          versions: "v2",
        };
        // Null fails the size comparison
        expect(arrayFilter(nullCategoriesRecord)).toBe(false);

        // Object instead of array
        const objectCategoriesRecord = {
          tags: ["standard", "premium"],
          categories: { count: 4, items: ["electronics", "computers", "accessories", "office"] }, // object instead of array
          versions: "v2",
        };
        // Object fails the size comparison
        expect(arrayFilter(objectCategoriesRecord)).toBe(false);
      });

      it("should handle in operator with different data types", () => {
        // Number instead of string for versions
        const numberVersionRecord = {
          tags: ["standard", "premium"],
          categories: ["electronics", "computers", "accessories", "office"],
          versions: 2, // number instead of string "v2"
        };
        expect(arrayFilter(numberVersionRecord)).toBe(false);

        // Array instead of scalar for versions
        const arrayVersionRecord = {
          tags: ["standard", "premium"],
          categories: ["electronics", "computers", "accessories", "office"],
          versions: ["v1", "v2"], // array instead of scalar
        };
        // in operator doesn't check if array contains any of the values
        expect(arrayFilter(arrayVersionRecord)).toBe(false);
      });
    });
  });
});
