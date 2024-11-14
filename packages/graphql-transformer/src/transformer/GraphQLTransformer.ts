import {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  parse,
  UnionTypeDefinitionNode,
} from "graphql";

export interface GraphQLTransformerOptions {
  definition: string;
}

export class GraphQLTransformer {
  constructor(protected readonly options: GraphQLTransformerOptions) {}

  public transform() {
    const document = parse(this.options.definition);

    for (const definition of document.definitions) {
      switch (definition.kind) {
        case Kind.INTERFACE_TYPE_DEFINITION:
          this._transformInterface(definition);
          break;
        case Kind.OBJECT_TYPE_DEFINITION:
          this._transformObject(definition);
          break;
        case Kind.ENUM_TYPE_DEFINITION:
          this._transformEnum(definition);
          break;
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
          this._transformInput(definition);
          break;
        case Kind.UNION_TYPE_DEFINITION:
          this._transformUnion(definition);
          break;
        default:
          continue;
      }
    }

    return {
      schema: "",
      resolvers: {},
      typeDefs: "",
    };
  }

  private _transformInterface(definition: InterfaceTypeDefinitionNode) {
    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformField(field);
    }
  }
  private _transformObject(definition: ObjectTypeDefinitionNode) {
    // Loop over each plugins and execute the ones that matches the object

    // Transform fields
    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformField(field);
    }
  }

  private _transformInput(definition: InputObjectTypeDefinitionNode) {
    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformInputValue(field);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _transformEnum(definition: EnumTypeDefinitionNode) {
    // Loop over each plugins and execute the ones that matches the enum
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _transformUnion(definition: UnionTypeDefinitionNode) {
    // Loop over each plugins and execute the ones that matches the union
  }
  private _transformInputValue(definition: InputValueDefinitionNode) {
    // Loop over each plugins and execute the ones that matches the input value

    // Transform default value
    const defaultValue = definition.defaultValue;
    if (defaultValue) {
      // Loop over each plugins and execute the ones that matches the default value
    }
  }

  private _transformField(definition: FieldDefinitionNode) {
    // Loop over each plugins and execute the ones that matches the field

    // Transform arguments
    const args = definition.arguments ?? [];
    for (const arg of args) {
      this._transformInputValue(arg);
    }
  }
}
