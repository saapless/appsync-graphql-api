import { ConstDirectiveNode, Kind, UnionTypeDefinitionNode } from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { NamedTypeNode } from "./TypeNode";

export class UnionNode {
  kind: Kind.UNION_TYPE_DEFINITION = Kind.UNION_TYPE_DEFINITION;
  name: string;
  types?: NamedTypeNode[] | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(
    name: string,
    types?: NamedTypeNode[] | null,
    directives?: DirectiveNode[] | undefined
  ) {
    this.name = name;
    this.types = types ?? undefined;
    this.directives = directives;
  }

  public serialize(): UnionTypeDefinitionNode {
    return {
      kind: Kind.UNION_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      types: this.types?.map((type) => type.serialize()),
      directives: this.directives?.map((node) => node.serialize()),
    };
  }

  public hasType(type: string) {
    return this.types?.some((node) => node.name === type) ?? false;
  }

  public addType(type: string | NamedTypeNode) {
    const typeNode = type instanceof NamedTypeNode ? type : NamedTypeNode.create(type);

    if (this.hasType(typeNode.name)) {
      throw new Error(`Type ${typeNode.name} already exists on union ${this.name}`);
    }

    this.types = this.types ?? [];
    this.types.push(typeNode);

    return this;
  }

  public removeType(type: string) {
    this.types = this.types?.filter((node) => node.name !== type);
    return this;
  }

  public hasDirective(name: string) {
    return this.directives?.some((node) => node.name === name) ?? false;
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
    this.directives = this.directives?.filter((node) => node.name !== name);
    return this;
  }

  static create(name: string, types: (NamedTypeNode | string)[] = []): UnionNode {
    return new UnionNode(
      name,
      types.map((type) => (type instanceof NamedTypeNode ? type : NamedTypeNode.create(type)))
    );
  }

  static fromDefinition(definition: UnionTypeDefinitionNode) {
    return new UnionNode(
      definition.name.value,
      definition.types?.map((node) => NamedTypeNode.create(node.name.value)) ?? null,
      definition.directives?.map((node) => DirectiveNode.fromDefinition(node))
    );
  }
}
