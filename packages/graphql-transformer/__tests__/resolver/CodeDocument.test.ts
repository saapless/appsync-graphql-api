import { CodeDocument } from "../../src/resolver";

describe("CodeDocument", () => {
  it("should generate node", () => {
    const codeNode = CodeDocument.create();
    expect(codeNode.serialize()).toMatchSnapshot();
  });
});
