import { ConstDirectiveNode, EnumValueDefinitionNode, Kind } from "graphql";
import { DirectiveNode } from "./DirectiveNode";

export class EnumValueNode {
  kind: Kind.ENUM_VALUE_DEFINITION = Kind.ENUM_VALUE_DEFINITION;
  name: string;
  directives?: DirectiveNode[] | undefined;

  constructor(name: string, directives?: DirectiveNode[]) {
    this.name = name;
    this.directives = directives;
  }

  public hasDirective(name: string) {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public getDirective(name: string) {
    return this.directives?.find((directive) => directive.name === name);
  }

  public addDirective(directive: string | DirectiveNode | ConstDirectiveNode) {
    const node =
      directive instanceof DirectiveNode
        ? directive
        : typeof directive === "string"
          ? DirectiveNode.create(directive)
          : DirectiveNode.fromDefinition(directive);

    if (this.hasDirective(node.name)) {
      throw new Error(`Directive ${node.name} already exists on enum value ${this.name}`);
    }

    this.directives = this.directives ?? [];
    this.directives.push(node);
    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }

  public serialize(): EnumValueDefinitionNode {
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      directives: this.directives?.map((node) => node.serialize()),
    };
  }

  static create(name: string, directives?: string[] | DirectiveNode[] | ConstDirectiveNode[]) {
    return new EnumValueNode(
      name,
      directives?.map((directive) =>
        directive instanceof DirectiveNode
          ? directive
          : typeof directive === "string"
            ? DirectiveNode.create(directive)
            : DirectiveNode.fromDefinition(directive)
      )
    );
  }

  static fromDefinition(definition: EnumValueDefinitionNode) {
    return new EnumValueNode(
      definition.name.value,
      definition.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }
}
