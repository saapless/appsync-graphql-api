// import ts from "typescript";
import { TransformerContext } from "../context";
import { GeneratorBase } from "./GeneratorBase";

export class ResolverTypesGenerator extends GeneratorBase {
  constructor(context: TransformerContext) {
    super(context);
  }

  public generate(filename: string): string {
    return this._printDefinitions(filename);
  }
}
