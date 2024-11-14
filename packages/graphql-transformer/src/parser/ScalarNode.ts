import { ConstDirectiveNode, Kind, ScalarTypeDefinitionNode } from "graphql";
import { DirectiveNode } from "./DirectiveNode";

export class ScalarNode {
  kind: Kind.SCALAR_TYPE_DEFINITION = Kind.SCALAR_TYPE_DEFINITION;
  name: string;
  directives?: DirectiveNode[] = [];

  constructor(name: string, directives?: DirectiveNode[]) {
    this.name = name;
    this.directives = directives;
  }

  public hasDirective(name: string): boolean {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public addDirective(directive: string | DirectiveNode | ConstDirectiveNode) {
    const node =
      directive instanceof DirectiveNode
        ? directive
        : typeof directive === "string"
          ? DirectiveNode.create(directive)
          : DirectiveNode.fromDefinition(directive);

    if (this.hasDirective(node.name)) {
      throw new Error(`Directive ${node.name} already exists on type ${this.name}`);
    }

    this.directives = this.directives ?? [];
    this.directives.push(node);

    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }

  public serialize(): ScalarTypeDefinitionNode {
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
    };
  }

  static fromDefinition(definition: ScalarTypeDefinitionNode) {
    return new ScalarNode(
      definition.name.value,
      definition.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }

  static create(name: string) {
    return new ScalarNode(name);
  }
}
