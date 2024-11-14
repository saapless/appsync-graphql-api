import {
  ConstValueNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  TypeNode as TypeNodeDefinition,
} from "graphql";
import { DirectiveNode } from "./DirectiveNode";
import { TypeNode } from "./TypeNode";

export class InputValueNode {
  name: string;
  type: TypeNode;
  defaultValue?: ConstValueNode | undefined;
  directives?: DirectiveNode[] | undefined;

  constructor(
    name: string,
    type: TypeNode,
    defaultValue?: ConstValueNode | null,
    directives?: DirectiveNode[]
  ) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue ?? undefined;
    this.directives = directives;
  }

  public serialize(): InputValueDefinitionNode {
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: this.name,
      },
      type: this.type.serialize(),
      defaultValue: this.defaultValue,
      directives: this.directives?.map((directive) => directive.serialize()),
    };
  }

  static create(name: string, value: string | TypeNode | TypeNodeDefinition) {
    return new InputValueNode(
      name,
      value instanceof TypeNode
        ? value
        : typeof value === "string"
          ? TypeNode.create(value)
          : TypeNode.fromDefinition(value)
    );
  }

  static fromDefinition(field: FieldDefinitionNode | InputValueDefinitionNode) {
    return new InputValueNode(
      field.name.value,
      TypeNode.fromDefinition(field.type),
      "defaultValue" in field ? field.defaultValue : null,
      field.directives?.map((directive) => DirectiveNode.fromDefinition(directive))
    );
  }
}
