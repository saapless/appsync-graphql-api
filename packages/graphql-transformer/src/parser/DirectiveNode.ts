import { ConstDirectiveNode, Kind } from "graphql";
import { ArgumentNode } from "./ArgumentNode";

export class DirectiveNode {
  kind: Kind.DIRECTIVE = Kind.DIRECTIVE;
  name: string;
  arguments?: ArgumentNode[] | undefined;

  constructor(name: string, args?: ArgumentNode[]) {
    this.name = name;
    this.arguments = args;
  }

  public serialize(): ConstDirectiveNode {
    return {
      kind: Kind.DIRECTIVE,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      arguments: this.arguments?.map((arg) => arg.serialize()),
    };
  }

  static create(name: string, args?: ArgumentNode[]) {
    return new DirectiveNode(name, args);
  }

  static fromDefinition(definition: ConstDirectiveNode) {
    const args = definition.arguments?.map((arg) => new ArgumentNode(arg.name.value, arg.value));

    return new DirectiveNode(definition.name.value, args);
  }
}
