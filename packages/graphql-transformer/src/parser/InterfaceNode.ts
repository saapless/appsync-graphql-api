import {
  ConstDirectiveNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  NamedTypeNode as INamedTypeNode,
  Kind,
} from "graphql";
import { FieldNode } from "./FieldNode";
import { DirectiveNode } from "./DirectiveNode";
import { NamedTypeNode } from "./TypeNode";

export class InterfaceNode {
  kind: Kind.INTERFACE_TYPE_DEFINITION = Kind.INTERFACE_TYPE_DEFINITION;
  name: string;
  fields?: FieldNode[] | undefined;
  interfaces?: NamedTypeNode[] | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(
    name: string,
    fields?: FieldNode[] | null,
    interfaces?: NamedTypeNode[] | null,
    directives?: DirectiveNode[] | undefined
  ) {
    this.name = name;
    this.fields = fields ?? undefined;
    this.interfaces = interfaces ?? undefined;
    this.directives = directives ?? undefined;
  }

  public hasInterface(name: string): boolean {
    return this.interfaces?.some((iface) => iface.name === name) ?? false;
  }

  public addInterface(iface: string | NamedTypeNode | INamedTypeNode) {
    const node =
      iface instanceof NamedTypeNode
        ? iface
        : typeof iface === "string"
          ? NamedTypeNode.create(iface)
          : NamedTypeNode.fromDefinition(iface);

    if (this.hasInterface(node.name)) {
      throw new Error(`Interface ${node.name} already exists on type ${this.name}`);
    }
    this.interfaces = this.interfaces ?? [];
    this.interfaces.push(node);

    return this;
  }

  public removeInterface(name: string) {
    this.interfaces = this.interfaces?.filter((iface) => iface.name !== name);
    return this;
  }

  public hasField(name: string): boolean {
    return this.fields?.some((field) => field.name === name) ?? false;
  }

  public addField(field: FieldNode | FieldDefinitionNode) {
    const node = field instanceof FieldNode ? field : FieldNode.fromDefinition(field);

    if (this.hasField(node.name)) {
      throw new Error(`Field ${node.name} already exists on type ${this.name}`);
    }

    this.fields = this.fields ?? [];
    this.fields.push(node);

    return this;
  }

  public removeField(name: string) {
    this.fields = this.fields?.filter((field) => field.name !== name);
    return this;
  }

  public hasDirective(name: string): boolean {
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

    this.directives = this.directives ?? [];
    this.directives.push(node);

    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }

  public extend(definition: InterfaceTypeExtensionNode) {
    const { fields, directives, interfaces } = definition;

    if (fields) {
      for (const field of fields) {
        this.addField(field);
      }
    }

    if (directives) {
      for (const directive of directives) {
        this.addDirective(directive);
      }
    }

    if (interfaces) {
      for (const iface of interfaces) {
        this.addInterface(iface);
      }
    }

    return this;
  }

  public serialize(): InterfaceTypeDefinitionNode {
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      fields: this.fields?.map((node) => node.serialize()),
      interfaces: this.interfaces?.map((node) => node.serialize()),
      directives: this.directives?.map((node) => node.serialize()),
    };
  }

  static fromDefinition(definition: InterfaceTypeDefinitionNode) {
    return new InterfaceNode(
      definition.name.value,
      definition.fields?.map((field) => FieldNode.fromDefinition(field)) ?? undefined,
      definition.interfaces?.map((node) => NamedTypeNode.fromDefinition(node)) ?? null,
      definition.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }

  static create(name: string, fields: FieldNode[] = []): InterfaceNode {
    return new InterfaceNode(name, fields);
  }
}
