import { ConstDirectiveNode, FieldDefinitionNode, InputValueDefinitionNode, Kind } from "graphql";
import { InputValueNode } from "./InputValueNode";
import { DirectiveNode } from "./DirectiveNode";
import { ListTypeNode, NamedTypeNode, NonNullTypeNode, TypeNode } from "./TypeNode";

export class FieldNode {
  readonly kind: Kind.FIELD_DEFINITION = Kind.FIELD_DEFINITION;
  readonly name: string;
  public type: TypeNode;
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

  public hasArgument(arg: string) {
    return this.arguments?.some((argument) => argument.name === arg) ?? false;
  }

  public getArgument(arg: string) {
    return this.arguments?.find((argument) => argument.name === arg);
  }

  public addArgument(argument: InputValueNode | InputValueDefinitionNode) {
    const argumentNode =
      argument instanceof InputValueNode ? argument : InputValueNode.fromDefinition(argument);

    if (this.hasArgument(argumentNode.name)) {
      throw new Error(`Argument ${argument.name} already exists on field ${this.name}`);
    }

    this.arguments = this.arguments ?? [];
    this.arguments.push(argumentNode);
    return this;
  }

  public removeArgument(arg: string) {
    this.arguments = this.arguments?.filter((argument) => argument.name !== arg);
    return this;
  }

  public hasDirective(name: string): boolean {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public getDirective(name: string) {
    return this.directives?.find((directive) => directive.name === name);
  }

  public addDirective(directive: DirectiveNode | ConstDirectiveNode) {
    const directiveNode =
      directive instanceof DirectiveNode ? directive : DirectiveNode.fromDefinition(directive);

    this.directives = this.directives ?? [];
    this.directives.push(directiveNode);
    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }

  public setType(type: TypeNode) {
    this.type = type;
    return this;
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
      field.type.kind === Kind.NON_NULL_TYPE
        ? NonNullTypeNode.fromDefinition(field.type)
        : field.type.kind === Kind.LIST_TYPE
          ? ListTypeNode.fromDefinition(field.type)
          : NamedTypeNode.fromDefinition(field.type),
      field.arguments?.map((arg) => InputValueNode.fromDefinition(arg)) ?? null,
      field.directives?.map((directive) => DirectiveNode.fromDefinition(directive)) ?? undefined
    );
  }
}
