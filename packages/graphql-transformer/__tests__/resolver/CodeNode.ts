import { CodeNode } from "../../src/resolver";
describe("CodeNode", () => {
  it("should generate node", () => {
    const codeNode = CodeNode.create();
    expect(codeNode.serialize()).toMatchSnapshot();
  });
});
