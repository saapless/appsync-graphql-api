import { CodeNode } from "./CodeNode";

export class FieldResolver {
  typeName: string;
  fieldName: string;
  dataSource?: string;
  pipelineFunctions?: string[];
  code: CodeNode;

  constructor(
    typeName: string,
    fieldName: string,
    dataSource?: string,
    pipelineFunctions?: string[]
  ) {
    this.typeName = typeName;
    this.fieldName = fieldName;
    this.dataSource = dataSource;
    this.pipelineFunctions = pipelineFunctions;
    this.code = CodeNode.create();
  }

  static create(
    typeName: string,
    fieldName: string,
    dataSource?: string,
    pipelineFunctions?: string[]
  ) {
    return new FieldResolver(typeName, fieldName, dataSource, pipelineFunctions);
  }
}
