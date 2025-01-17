import {
  ConstDirectiveNode,
  Kind,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
  NamedTypeNode as INamedTypeNode,
} from "graphql";
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

  public hasType(type: string) {
    return this.types?.some((node) => node.name === type) ?? false;
  }

  public getType(type: string) {
    return this.types?.find((node) => node.name === type);
  }

  public addType(type: string | NamedTypeNode | INamedTypeNode) {
    const typeNode =
      type instanceof NamedTypeNode
        ? type
        : typeof type === "string"
          ? NamedTypeNode.create(type)
          : NamedTypeNode.fromDefinition(type);

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

  public getDirective(name: string) {
    return this.directives?.find((node) => node.name === name);
  }

  public addDirective(directive: string | DirectiveNode | ConstDirectiveNode) {
    const node =
      directive instanceof DirectiveNode
        ? directive
        : typeof directive === "string"
          ? DirectiveNode.create(directive)
          : DirectiveNode.fromDefinition(directive);

    this.directives = this.directives ?? [];
    this.directives.push(node);
    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((node) => node.name !== name);
    return this;
  }

  public extend(definition: UnionTypeExtensionNode) {
    const { types, directives } = definition;

    if (types) {
      for (const type of types) {
        this.addType(type);
      }
    }

    if (directives) {
      for (const directive of directives) {
        this.addDirective(directive);
      }
    }

    return this;
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
