import ts from "typescript";
import { TransformerContext } from "../context";

export abstract class GeneratorBase {
  protected readonly _definitions: ts.Node[];
  protected readonly _context: TransformerContext;

  constructor(context: TransformerContext) {
    this._context = context;
    this._definitions = [];
  }

  protected _printDefinitions(filename: string) {
    const file = ts.createSourceFile(filename, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

    const result = printer.printList(
      ts.ListFormat.MultiLine,
      ts.factory.createNodeArray(this._definitions),
      file
    );

    return result;
  }
  public abstract generate(filename: string): string;
}
