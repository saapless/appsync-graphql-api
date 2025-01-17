import {
  DocumentNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InterfaceNode,
  NonNullTypeNode,
  ObjectNode,
  UnionNode,
} from "../../parser";
import { pascalCase } from "../../utils/strings";
import { CodeDeclaration, printAST, tc, TypeProperty } from "../code";

export default class TypeGenerator {
  private readonly _definitions: CodeDeclaration[];

  constructor(protected document: DocumentNode) {
    this._definitions = [];
  }

  private _value(ref: string) {
    switch (ref) {
      case "ID":
      case "String":
        return tc.typeRef("string");
      case "Boolean":
        return tc.typeRef("boolean");
      case "Int":
      case "Float":
        return tc.typeRef("number");
      default:
        return tc.typeRef(ref);
    }
  }

  private _args(object: ObjectNode | InterfaceNode, fieldName: FieldNode) {
    const name = pascalCase(object.name, fieldName.name, "args");
    const values =
      fieldName.arguments?.reduce((agg, arg) => {
        agg.push(
          tc.typeProp(
            arg.name,
            this._value(arg.type.getTypeName()),
            !(arg.type instanceof NonNullTypeNode)
          )
        );
        return agg;
      }, [] as TypeProperty[]) ?? [];

    return this._definitions.push(tc.export(tc.typeDef(name, tc.typeObj(values))));
  }

  private _interface(object: InterfaceNode) {
    const props: TypeProperty[] = [];

    for (const field of object.fields ?? []) {
      props.push(
        tc.typeProp(
          field.name,
          this._value(field.type.getTypeName()),
          !(field.type instanceof NonNullTypeNode)
        )
      );

      if (field.arguments?.length) {
        this._args(object, field);
      }
    }

    this._definitions.push(tc.export(tc.typeInterface(object.name, tc.typeObj(props))));
  }

  private _enum(node: EnumNode) {
    const values = node.values?.map((v) => tc.str(v.name)) ?? [];

    this._definitions.push(tc.export(tc.typeDef(node.name, tc.typeUnion(values))));
  }

  private _object(object: ObjectNode | InputObjectNode) {
    const props: TypeProperty[] = [];

    for (const field of object.fields ?? []) {
      props.push(
        tc.typeProp(
          field.name,
          this._value(field.type.getTypeName()),
          !(field.type instanceof NonNullTypeNode)
        )
      );

      if (object instanceof ObjectNode && field instanceof FieldNode && field.arguments?.length) {
        this._args(object, field);
      }
    }

    this._definitions.push(tc.export(tc.typeDef(object.name, tc.typeObj(props))));
  }

  public _union(node: UnionNode) {
    this._definitions.push(
      tc.export(
        tc.typeDef(
          node.name,
          tc.typeUnion(node.types?.map((t) => tc.typeRef(t.getTypeName())) ?? [])
        )
      )
    );
  }

  public generate() {
    for (const def of this.document.definitions.values()) {
      switch (def.kind) {
        case "ObjectTypeDefinition":
        case "InputObjectTypeDefinition":
          this._object(def);
          break;
        case "InterfaceTypeDefinition":
          this._interface(def);
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

    return printAST(tc.doc(...this._definitions));
  }
}
