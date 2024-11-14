import {
  NamedTypeNode as INamedTypeNode,
  ListTypeNode as IListTypeNode,
  NonNullTypeNode as INonNullTypeNode,
  TypeNode as ITypeNode,
  Kind,
  Location,
} from "graphql";

export class NamedTypeNode {
  name: string;
  loc?: Location;
  constructor(name: string, loc?: Location) {
    this.name = name;
    this.loc = loc;
  }

  public serialize(): INamedTypeNode {
    return {
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      loc: this.loc,
    };
  }

  static create(name: string): NamedTypeNode {
    return new NamedTypeNode(name);
  }

  static fromDefinition(definition: INamedTypeNode): NamedTypeNode {
    return new NamedTypeNode(definition.name.value, definition.loc);
  }
}

export class ListTypeNode {
  type: TypeNode;
  loc?: Location;

  constructor(type: TypeNode, loc?: Location) {
    this.type = type;
    this.loc = loc;
  }

  public serialize(): IListTypeNode {
    return {
      kind: Kind.LIST_TYPE,
      type: this.type.serialize(),
      loc: this.loc,
    };
  }

  static create(type: TypeNode | string, nullable = true): ListTypeNode {
    return new ListTypeNode(
      type instanceof TypeNode ? type : TypeNode.create(type, nullable),
      type instanceof TypeNode ? type.node.loc : undefined
    );
  }

  static fromDefinition(definition: IListTypeNode): ListTypeNode {
    return new ListTypeNode(TypeNode.fromDefinition(definition.type), definition.loc);
  }
}

export class NonNullTypeNode {
  type: NamedTypeNode | ListTypeNode;
  loc?: Location;

  constructor(type: NamedTypeNode | ListTypeNode, loc?: Location) {
    this.type = type;
    this.loc = loc;
  }

  public serialize(): INonNullTypeNode {
    return {
      kind: Kind.NON_NULL_TYPE,
      type: this.type.serialize(),
      loc: this.loc,
    };
  }

  static create(type: NamedTypeNode | ListTypeNode | string | string[]): NonNullTypeNode {
    if (Array.isArray(type)) {
      return new NonNullTypeNode(ListTypeNode.create(TypeNode.create(type[0])));
    }

    if (typeof type === "string") {
      return new NonNullTypeNode(NamedTypeNode.create(type));
    }

    return new NonNullTypeNode(type);
  }

  static fromDefinition(definition: INonNullTypeNode): NonNullTypeNode {
    const node =
      definition.type.kind === Kind.NAMED_TYPE
        ? NamedTypeNode.fromDefinition(definition.type)
        : ListTypeNode.fromDefinition(definition.type);

    return new NonNullTypeNode(node, definition.loc);
  }
}

export class TypeNode {
  node: NamedTypeNode | ListTypeNode | NonNullTypeNode;

  constructor(node: NamedTypeNode | ListTypeNode | NonNullTypeNode) {
    this.node = node;
  }

  public serialize(): ITypeNode {
    return this.node.serialize();
  }

  public isNullable() {
    return this.node instanceof NamedTypeNode || this.node instanceof ListTypeNode;
  }

  public makeNullable() {
    if (this.node instanceof NonNullTypeNode) {
      this.node = this.node.type;
    }

    return this;
  }

  public makeNonNullable() {
    if (this.node instanceof NamedTypeNode || this.node instanceof ListTypeNode) {
      this.node = NonNullTypeNode.create(this.node);
    }

    return this;
  }

  clone() {
    return new TypeNode(this.node);
  }

  static fromDefinition(type: ITypeNode) {
    const node =
      type.kind === Kind.NAMED_TYPE
        ? NamedTypeNode.fromDefinition(type)
        : type.kind === Kind.LIST_TYPE
          ? ListTypeNode.fromDefinition(type)
          : NonNullTypeNode.fromDefinition(type);

    return new TypeNode(node);
  }

  static create(type: string | [string], nullable = true) {
    let node: NamedTypeNode | ListTypeNode;

    if (Array.isArray(type)) {
      node = ListTypeNode.create(TypeNode.create(type));
    } else {
      node = NamedTypeNode.create(type);
    }

    return new TypeNode(nullable ? node : NonNullTypeNode.create(node));
  }
}
