import {
  DocumentNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InterfaceNode,
  NonNullTypeNode,
  ObjectNode,
  UnionNode,
} from "../parser";
import { pascalCase } from "../utils/strings";
import { CodeDeclaration, printAST, tc, TypeProperty } from "../codegen";

export class TypesGenerator {
  private readonly _definitions: CodeDeclaration[];

  constructor(protected document: DocumentNode) {
    this._definitions = [];
  }

  private _defaults() {
    this._definitions.push(
      tc.export(
        tc.typeDef(
          tc.typeRef("Maybe", [tc.typeRef("T")]),
          tc.typeUnion([tc.typeRef("T"), tc.typeRef("null"), tc.typeRef("undefined")])
        )
      ),
      tc.export(
        tc.typeDef(
          tc.typeRef("DynamoDBQueryResult", [tc.typeRef("T = unknown")]),
          tc.typeObj([
            tc.typeProp("items", tc.typeRef("Array", [tc.typeRef("T")]), false),
            tc.typeProp(
              "nextToken",
              tc.typeUnion([tc.typeRef("string"), tc.typeRef("null")]),
              true
            ),
          ])
        )
      ),
      tc.export(
        tc.typeDef(
          tc.typeRef("DynamoDbBatchGetResult", [tc.typeExtends("T", tc.typeRef("Node"))]),
          tc.typeObj([
            tc.typeProp(
              "data",
              tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("Array", [tc.typeRef("T")])]),
              false
            ),
            tc.typeProp(
              "unprocessedKeys",
              tc.typeRef("Record", [
                tc.typeRef("string"),
                tc.typeRef("Array", [tc.typeRef("Pick", [tc.typeRef("T"), tc.str("id")])]),
              ]),
              false
            ),
          ])
        )
      ),
      tc.export(
        tc.typeDef(
          tc.typeRef("PipelineCommandInstructions"),
          tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("unknown")])
        )
      ),
      tc.export(
        tc.typeDef(
          tc.typeRef("PipelineCommand", [tc.typeRef("T = unknown")]),
          tc.typeObj([
            tc.typeProp("payload", tc.typeRef("T")),
            tc.typeProp("instructions", tc.typeRef("PipelineCommandInstructions"), true),
          ])
        )
      ),
      tc.export(
        tc.typeDef(
          tc.typeRef("PipelinePrevResult", [
            tc.typeRef("TCommand = unknown"),
            tc.typeRef("TResult = unknown"),
          ]),
          tc.typeObj([
            tc.typeProp(
              "result",
              tc.typeObj([
                tc.typeProp(
                  "commands",
                  tc.typeRef("Array", [tc.typeRef("PipelineCommand", [tc.typeRef("TCommand")])])
                ),
                tc.typeProp("results", tc.typeRef("Array", [tc.typeRef("TResult")]), true),
              ])
            ),
          ])
        )
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
        return tc.typeRef("string");
      case "AWSJSON":
        return tc.typeRef("Record", [tc.typeRef("string"), tc.typeRef("unknown")]);
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
            arg.type instanceof NonNullTypeNode
              ? this._value(arg.type.getTypeName())
              : tc.typeRef("Maybe", [this._value(arg.type.getTypeName())]),
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
          field.type instanceof NonNullTypeNode
            ? this._value(field.type.getTypeName())
            : tc.typeRef("Maybe", [this._value(field.type.getTypeName())]),
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

  private _input(node: InputObjectNode) {
    this._definitions.push(
      tc.export(
        tc.typeDef(
          node.name,
          tc.typeObj(
            node.fields?.map((field) => {
              return tc.typeProp(
                field.name,
                field.type instanceof NonNullTypeNode
                  ? this._value(field.type.getTypeName())
                  : tc.typeRef("Maybe", [this._value(field.type.getTypeName())]),
                !(field.type instanceof NonNullTypeNode)
              );
            }) ?? []
          )
        )
      )
    );
  }

  private _object(object: ObjectNode) {
    const props: TypeProperty[] = [];

    for (const field of object.fields ?? []) {
      if (!field.hasDirective("hasOne") && !field.hasDirective("hasMany")) {
        props.push(
          tc.typeProp(
            field.name,
            field.type instanceof NonNullTypeNode
              ? this._value(field.type.getTypeName())
              : tc.typeRef("Maybe", [this._value(field.type.getTypeName())]),
            !(field.type instanceof NonNullTypeNode)
          )
        );
      }

      if (field.arguments?.length) {
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
    this._defaults();

    for (const def of this.document.definitions.values()) {
      switch (def.kind) {
        case "ObjectTypeDefinition":
          this._object(def);
          break;
        case "InputObjectTypeDefinition":
          this._input(def);
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
