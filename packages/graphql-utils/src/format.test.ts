import { formatConnection, formatEdge, formatEdges } from "./format";

describe("format", () => {
  describe("formatConnection", () => {
    it("should format a connection object correctly", () => {
      const records = [
        { id: "1", name: "Node 1" },
        { id: "2", name: "Node 2" },
      ];
      const result = formatConnection({ items: records, prevToken: null, nextToken: null });
      expect(result).toEqual({
        edges: [
          { node: { id: "1", name: "Node 1" }, cursor: btoa("1") },
          { node: { id: "2", name: "Node 2" }, cursor: btoa("2") },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
          hasPreviousPage: false,
          startCursor: null,
        },
      });
    });
  });

  describe("formatEdges", () => {
    it("should format edges correctly", () => {
      const records = [
        { id: "1", name: "Node 1" },
        { id: "2", name: "Node 2" },
      ];
      const result = formatEdges(records);
      expect(result).toEqual([
        { node: { id: "1", name: "Node 1" }, cursor: btoa("1") },
        { node: { id: "2", name: "Node 2" }, cursor: btoa("2") },
      ]);
    });
  });

  describe("formatEdge", () => {
    it("should format a single edge correctly", () => {
      const record = { id: "1", name: "Node 1" };
      const result = formatEdge(record);
      expect(result).toEqual({ node: { id: "1", name: "Node 1" }, cursor: btoa("1") });
    });
  });
});
