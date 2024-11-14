import { ConstDirectiveNode, FieldDefinitionNode, InputValueDefinitionNode, Kind } from "graphql";
import { InputValueNode } from "./InputValueNode";
import { DirectiveNode } from "./DirectiveNode";
import { TypeNode } from "./TypeNode";

export class FieldNode {
  name: string;
  type: TypeNode;
  arguments?: InputValueNode[] | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(
    name: string,
    type: TypeNode,
    args?: InputValueNode[] | null,
    directives?: DirectiveNode[] | undefined
  ) {
    this.name = name;
    this.type = type;
    this.arguments = args ?? undefined;
    this.directives = directives;
  }

  public addArgument(argument: InputValueNode | InputValueDefinitionNode) {
    this.arguments = this.arguments ?? [];
    this.arguments.push(
      argument instanceof InputValueNode ? argument : InputValueNode.fromDefinition(argument)
    );
  }

  public addDirective(directive: DirectiveNode | ConstDirectiveNode) {
    this.directives = this.directives ?? [];
    this.directives.push(
      directive instanceof DirectiveNode ? directive : DirectiveNode.fromDefinition(directive)
    );
  }

  public serialize(): FieldDefinitionNode {
    return {
      kind: Kind.FIELD_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      type: this.type.serialize(),
      arguments: this.arguments?.map((arg) => arg.serialize()),
      directives: this.directives?.map((directive) => directive.serialize()),
    };
  }

  static create(
    name: string,
    type: TypeNode,
    args?: InputValueNode[] | null,
    directives?: DirectiveNode[]
  ) {
    return new FieldNode(name, type, args ?? null, directives);
  }

  static fromDefinition(field: FieldDefinitionNode) {
    return new FieldNode(
      field.name.value,
      TypeNode.fromDefinition(field.type),
      field.arguments?.map((arg) => InputValueNode.fromDefinition(arg)) ?? null,
      field.directives?.map((directive) => DirectiveNode.fromDefinition(directive)) ?? undefined
    );
  }
}
