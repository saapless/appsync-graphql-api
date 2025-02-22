import * as ts from "typescript";
import {
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  NonNullTypeNode,
  ObjectNode,
  UnionNode,
} from "../definition";
import { pascalCase } from "../utils/strings";
import { TransformerContext } from "../context";
import { GeneratorBase } from "./GeneratorBase";

export class SchemaTypesGenerator extends GeneratorBase {
  constructor(context: TransformerContext) {
    super(context);
  }

  private _utils() {
    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier("Maybe"),
        [ts.factory.createTypeParameterDeclaration(undefined, "T")],
        ts.factory.createUnionTypeNode([
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("T"), undefined),
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("null"), undefined),
          ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("undefined"), undefined),
        ])
      )
    );
  }

  private _value(ref: string) {
    switch (ref) {
      case "ID":
      case "String":
      case "AWSURL":
      case "AWSEmail":
      case "AWSIPAddress":
      case "AWSPhone":
      case "AWSDateTime":
      case "AWSTime":
      case "AWSDate":
      case "AWSTimestamp":
        return ts.factory.createTypeReferenceNode("string");
      case "AWSJSON":
        return ts.factory.createTypeReferenceNode("Record", [
          ts.factory.createTypeReferenceNode("string"),
          ts.factory.createTypeReferenceNode("unknown"),
        ]);
      case "Boolean":
        return ts.factory.createTypeReferenceNode("boolean");
      case "Int":
      case "Float":
        return ts.factory.createTypeReferenceNode("number");
      default:
        return ts.factory.createTypeReferenceNode(ref);
    }
  }

  private _field(field: FieldNode | InputValueNode) {
    return ts.factory.createPropertySignature(
      undefined,
      ts.factory.createIdentifier(field.name),
      field.type instanceof NonNullTypeNode
        ? undefined
        : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      field.type instanceof NonNullTypeNode
        ? this._value(field.type.getTypeName())
        : ts.factory.createTypeReferenceNode("Maybe", [this._value(field.type.getTypeName())])
    );
  }

  private _args(object: ObjectNode | InterfaceNode, fieldName: FieldNode) {
    const name = pascalCase(object.name, fieldName.name, "args");
    const members: ts.TypeElement[] = [];

    for (const arg of fieldName.arguments ?? []) {
      members.push(this._field(arg));
    }

    return this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(name),
        undefined,
        ts.factory.createTypeLiteralNode(members)
      )
    );
  }

  private _interface(object: InterfaceNode) {
    const members: ts.TypeElement[] = [];

    for (const field of object.fields ?? []) {
      members.push(this._field(field));

      if (field.arguments?.length) {
        this._args(object, field);
      }
    }

    this._definitions.push(
      ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(object.name),
        undefined,
        undefined,
        members
      )
    );
  }

  private _enum(node: EnumNode) {
    const values =
      node.values?.map((value) =>
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(value.name))
      ) ?? [];

    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(node.name),
        undefined,
        ts.factory.createUnionTypeNode(values)
      )
    );
  }

  private _input(node: InputObjectNode) {
    const members: ts.TypeElement[] = [];

    for (const field of node.fields ?? []) {
      members.push(this._field(field));
    }

    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(node.name),
        undefined,
        ts.factory.createTypeLiteralNode(members)
      )
    );
  }

  private _object(node: ObjectNode) {
    const members: ts.TypeElement[] = [];

    for (const field of node.fields ?? []) {
      members.push(this._field(field));

      if (field.arguments?.length) {
        this._args(node, field);
      }
    }

    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(node.name),
        undefined,
        ts.factory.createTypeLiteralNode(members)
      )
    );
  }

  public _union(node: UnionNode) {
    this._definitions.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(node.name),
        undefined,
        ts.factory.createUnionTypeNode(
          node.types?.map((type) =>
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(type.name))
          ) ?? []
        )
      )
    );
  }

  public generate(filename: string) {
    this._utils();

    for (const def of this._context.document.definitions.values()) {
      switch (def.kind) {
        case "InterfaceTypeDefinition":
          this._interface(def);
          break;
        case "ObjectTypeDefinition":
          this._object(def);
          break;
        case "InputObjectTypeDefinition":
          this._input(def);
          break;
        case "EnumTypeDefinition":
          this._enum(def);
          break;
        case "UnionTypeDefinition":
          this._union(def);
          break;
        default:
          continue;
      }
    }

    return this._printDefinitions(filename);
  }
}
