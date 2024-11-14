import {
  ConstDirectiveNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from "graphql/language";
import { InputValueNode } from "./InputValueNode";
import { DirectiveNode } from "./DirectiveNode";

export class InputObjectNode {
  kind: Kind.INPUT_OBJECT_TYPE_DEFINITION = Kind.INPUT_OBJECT_TYPE_DEFINITION;
  name: string;
  fields?: InputValueNode[] | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(name: string, fields?: InputValueNode[], directives?: DirectiveNode[] | undefined) {
    this.name = name;
    this.fields = fields;
    this.directives = directives;
  }

  public hasField(name: string): boolean {
    return this.fields?.some((field) => field.name === name) ?? false;
  }

  public addField(field: InputValueNode | InputValueDefinitionNode | FieldDefinitionNode) {
    const fieldNode =
      field instanceof InputValueNode ? field : InputValueNode.fromDefinition(field);

    if (this.hasField(fieldNode.name)) {
      throw new Error(`Field ${field.name} already exists on type ${this.name}`);
    }

    this.fields = this.fields ?? [];
    this.fields.push(fieldNode);

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

  public serialize(): InputObjectTypeDefinitionNode {
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      fields: this.fields?.map((field) => field.serialize()),
      directives: this.directives?.map((directive) => directive.serialize()),
    };
  }

  static fromDefinition(
    definition: ObjectTypeDefinitionNode | InputObjectTypeDefinitionNode
  ): InputObjectNode {
    return new InputObjectNode(
      definition.name.value,
      definition.fields?.map((node) => InputValueNode.fromDefinition(node)) ?? undefined,
      definition.directives?.map((node) => DirectiveNode.fromDefinition(node)) ?? undefined
    );
  }

  static create(name: string, fields: InputValueNode[] = []): InputObjectNode {
    return new InputObjectNode(name, fields);
  }
}
