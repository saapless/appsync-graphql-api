import { ConstDirectiveNode, EnumTypeDefinitionNode, EnumValueDefinitionNode, Kind } from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { EnumValueNode } from "./EnumValueNode";

export class EnumNode {
  name: string;
  values?: EnumValueNode[] | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(name: string, values?: EnumValueNode[], directives?: DirectiveNode[]) {
    this.name = name;
    this.values = values;
    this.directives = directives;
  }

  public hasValue(name: string) {
    return this.values?.some((value) => value.name === name) ?? false;
  }

  public addValue(value: EnumValueNode | EnumValueDefinitionNode) {
    const valueNode = value instanceof EnumValueNode ? value : EnumValueNode.fromDefinition(value);

    if (this.hasValue(valueNode.name)) {
      return;
    }

    this.values = this.values ?? [];
    this.values.push(valueNode);
  }

  public removeValue(name: string) {
    this.values = this.values?.filter((value) => value.name !== name);
  }

  public hasDirective(name: string) {
    return this.directives?.some((directive) => directive.name === name);
  }

  public addDirective(directive: DirectiveNode | ConstDirectiveNode) {
    const directiveNode =
      directive instanceof DirectiveNode ? directive : DirectiveNode.fromDefinition(directive);

    if (this.hasDirective(directiveNode.name)) {
      return;
    }

    this.directives = this.directives ?? [];
    this.directives.push(directiveNode);
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
  }

  public serialize(): EnumTypeDefinitionNode {
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      values: this.values?.map((value) => value.serialize()),
      directives: this.directives?.map((directive) => directive.serialize()),
    };
  }

  static create(name: string, values: string[]) {
    return new EnumNode(
      name,
      values.map((value) => EnumValueNode.create(value))
    );
  }

  static fromDefinition(definition: EnumTypeDefinitionNode) {
    return new EnumNode(
      definition.name.value,
      definition.values?.map((value) => EnumValueNode.fromDefinition(value)) ?? undefined,
      definition.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }
}
