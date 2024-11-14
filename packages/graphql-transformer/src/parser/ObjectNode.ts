import { ConstDirectiveNode, FieldDefinitionNode, Kind, ObjectTypeDefinitionNode } from "graphql";
import { FieldNode } from "./FieldNode";
import { DirectiveNode } from "./DirectiveNode";
import { NamedTypeNode } from "./TypeNode";

export class ObjectNode {
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

  public hasInterface(name: string): boolean {
    return this.interfaces?.some((iface) => iface.name === name) ?? false;
  }

  public addInterface(node: string | NamedTypeNode) {
    this.interfaces = this.interfaces ?? [];
    this.interfaces.push(node instanceof NamedTypeNode ? node : NamedTypeNode.create(node));
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
    this.fields = this.fields ?? [];
    this.fields.push(field instanceof FieldNode ? field : FieldNode.fromDefinition(field));
    return this;
  }

  public removeField(name: string) {
    this.fields = this.fields?.filter((field) => field.name !== name);
    return this;
  }

  public hasDirective(name: string): boolean {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public addDirective(directive: string | DirectiveNode | ConstDirectiveNode) {
    this.directives = this.directives ?? [];
    this.directives.push(
      directive instanceof DirectiveNode
        ? directive
        : typeof directive === "string"
          ? DirectiveNode.create(directive)
          : DirectiveNode.fromDefinition(directive)
    );

    return this;
  }

  public serialize(): ObjectTypeDefinitionNode {
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      fields: this.fields?.map((field) => field.serialize()),
      interfaces: this.interfaces?.map((iface) => iface.serialize()),
      directives: this.directives?.map((node) => node.serialize()),
    };
  }

  static fromDefinition(definition: ObjectTypeDefinitionNode): ObjectNode {
    return new ObjectNode(
      definition.name.value,
      definition.fields?.map((field) => FieldNode.fromDefinition(field)) ?? undefined,
      definition.interfaces?.map((node) => NamedTypeNode.fromDefinition(node)) ?? undefined,
      definition.directives?.map((node) => DirectiveNode.fromDefinition(node))
    );
  }

  static create(name: string, fields: FieldNode[] = []): ObjectNode {
    return new ObjectNode(name, fields);
  }
}
