import { InterfaceTypeDefinitionNode, Kind, NamedTypeNode } from "graphql";
import { FieldNode } from "./FieldNode";
import { DirectiveNode } from "./DirectiveNode";

export class InterfaceNode {
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
    this.directives = directives;
  }

  public serialize(): InterfaceTypeDefinitionNode {
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      fields: this.fields?.map((node) => node.serialize()),
      interfaces: this.interfaces,
      directives: this.directives?.map((node) => node.serialize()),
    };
  }

  public hasField(name: string): boolean {
    return this.fields?.some((field) => field.name === name) ?? false;
  }

  public addField(field: FieldNode) {
    if (this.hasField(field.name)) {
      throw new Error(`Field ${field.name} already exists on type ${this.name}`);
    }

    this.fields?.push(field);
    return this;
  }

  public removeField(name: string) {
    this.fields = this.fields?.filter((field) => field.name !== name);
    return this;
  }

  public hasDirective(name: string): boolean {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public addDirective(directive: DirectiveNode) {
    if (this.hasDirective(directive.name)) {
      throw new Error(`Directive ${directive.name} already exists on type ${this.name}`);
    }

    this.directives?.push(directive);
    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }

  static create(name: string, fields: FieldNode[] = []): InterfaceNode {
    return new InterfaceNode(name, fields);
  }

  static fromDefinition(definition: InterfaceTypeDefinitionNode) {
    return new InterfaceNode(
      definition.name.value,
      definition.fields?.map((field) => FieldNode.fromDefinition(field)) ?? undefined,
      definition.interfaces?.map((node) => node) ?? null,
      definition.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }
}
