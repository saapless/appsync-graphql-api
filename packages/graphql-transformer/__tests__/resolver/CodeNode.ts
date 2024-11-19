import { CodeDocument } from "../../src/resolver";

describe("CodeNode", () => {
  it("should generate node", () => {
    const codeNode = CodeDocument.create();
    expect(codeNode.serialize()).toMatchSnapshot();
  });
});
