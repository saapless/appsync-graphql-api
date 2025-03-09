import { filterExpression } from "../src/filter";

describe("filterExpression", () => {
  it("matches string eq filter", () => {
    const match = filterExpression({ string: { eq: "string" } });
    expect(match({ string: "string" })).toBeTruthy();
  });

  it("matches string ne filter", () => {
    const match = filterExpression({ string: { ne: "string" } });
    expect(match({ string: "not-string" })).toBeTruthy();
  });

  it("matches string in filter", () => {
    const match = filterExpression({ string: { in: ["string"] } });
    expect(match({ string: "string" })).toBeTruthy();
  });
});
