import path from "node:path";
import ts from "typescript";
import { Kind } from "graphql";
import {
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
  TypeNode,
  UnionNode,
} from "../definition";
import { pascalCase } from "../utils/strings";
import { TransformerContext } from "../context";
import { prettyPrintFile } from "../utils";
import { GeneratorPluginBase } from "./GeneratorBase";
import { printDefinitions } from "./utils";

export class SchemaTypesGenerator extends GeneratorPluginBase {
  private readonly _definitions: ts.Node[];
  constructor(context: TransformerContext) {
    super("SchemaTypesGenerator", context);

    this._definitions = [];
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

  private _shouldIncludeField(field: FieldNode) {
    if (field.hasDirective("hasOne") || field.hasDirective("hasMany")) {
      return false;
    }

    return true;
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

  private _fieldType(type: TypeNode): ts.TypeNode {
    if (type instanceof NonNullTypeNode) {
      return this._fieldType(type.type);
    } else if (type instanceof ListTypeNode) {
      return ts.factory.createArrayTypeNode(this._value(type.getTypeName()));
    } else {
      return this._value(type.getTypeName());
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
        ? this._fieldType(field.type.type)
        : ts.factory.createTypeReferenceNode("Maybe", [this._fieldType(field.type)])
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
      if (this._shouldIncludeField(field)) {
        members.push(this._field(field));
      }

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
      if (this._shouldIncludeField(field)) {
        members.push(this._field(field));
      }

      if (field.arguments?.length) {
        this._args(node, field);
      }
    }

    if (!["Query", "Mutation", "Subscription"].includes(node.name)) {
      this._definitions.push(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          ts.factory.createIdentifier(node.name),
          undefined,
          ts.factory.createTypeLiteralNode(members)
        )
      );
    }
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

  public beforeCleanup(outDir: string) {
    this._utils();

    for (const def of this.context.document.definitions.values()) {
      switch (def.kind) {
        case Kind.INTERFACE_TYPE_DEFINITION:
          this._interface(def);
          break;
        case Kind.OBJECT_TYPE_DEFINITION:
          this._object(def);
          break;
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
          this._input(def);
          break;
        case Kind.ENUM_TYPE_DEFINITION:
          this._enum(def);
          break;
        case Kind.UNION_TYPE_DEFINITION:
          this._union(def);
          break;
        default:
          continue;
      }
    }

    const result = printDefinitions(this._definitions, "schema-types.ts");
    return prettyPrintFile(path.resolve(outDir, "schema-types.ts"), result);
  }

  public static create(context: TransformerContext) {
    return new SchemaTypesGenerator(context);
  }
}
