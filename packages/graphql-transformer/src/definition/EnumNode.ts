import {
  ConstDirectiveNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  EnumValueDefinitionNode,
  Kind,
} from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { EnumValueNode } from "./EnumValueNode";

export class EnumNode {
  kind: Kind.ENUM_TYPE_DEFINITION = Kind.ENUM_TYPE_DEFINITION;
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

  public addValue(value: string | EnumValueNode | EnumValueDefinitionNode) {
    const valueNode =
      value instanceof EnumValueNode
        ? value
        : typeof value === "string"
          ? EnumValueNode.create(value)
          : EnumValueNode.fromDefinition(value);

    if (this.hasValue(valueNode.name)) {
      throw new Error(`Value ${valueNode.name} already exists on enum ${this.name}`);
    }

    this.values = this.values ?? [];
    this.values.push(valueNode);
    return this;
  }

  public removeValue(name: string) {
    this.values = this.values?.filter((value) => value.name !== name);
    return this;
  }

  public hasDirective(name: string) {
    return this.directives?.some((directive) => directive.name === name);
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

  public extend(definition: EnumTypeExtensionNode) {
    const { values, directives } = definition;

    if (values) {
      for (const value of values) {
        this.addValue(value);
      }
    }

    if (directives) {
      for (const directive of directives) {
        this.addDirective(directive);
      }
    }

    return this;
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
