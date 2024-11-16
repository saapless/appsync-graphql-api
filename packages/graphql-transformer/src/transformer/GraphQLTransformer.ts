import { Kind } from "graphql/language";
import {
  DocumentNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ObjectNode,
  UnionNode,
} from "../parser";
import { TransformerContext } from "../context";
import { IPluginFactory, TransformerPluginBase } from "../plugins/TransformerPluginBase";
// import { SchemaValidationError } from "../utils/errors";

export interface GraphQLTransformerOptions {
  definition: string;
  plugins: IPluginFactory[];
}

export class GraphQLTransformer {
  readonly document: DocumentNode;
  readonly context: TransformerContext;
  readonly plugins: TransformerPluginBase[];

  constructor(protected readonly options: GraphQLTransformerOptions) {
    this.document = DocumentNode.fromSource(options.definition);
    this.context = new TransformerContext({ document: this.document });
    this.plugins = this._initPlugins(this.context);
  }

  private _initPlugins(context: TransformerContext) {
    return this.options.plugins.map((factory) => factory.create(context));
  }

  public transform() {
    // Run plugins before
    for (const plugin of this.plugins) {
      plugin.before();
    }

    // Should be safe to validate the schema here
    // const errors = this.document.validate();

    // if (errors.length) {
    //   throw new SchemaValidationError(errors)
    // }

    // Run transformers
    for (const definition of this.document.definitions) {
      switch (definition.kind) {
        case Kind.INTERFACE_TYPE_DEFINITION:
          this._transformInterface(definition);
          break;
        case Kind.OBJECT_TYPE_DEFINITION:
          this._transformObject(definition);
          break;
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
          this._transformInput(definition);
          break;
        case Kind.ENUM_TYPE_DEFINITION:
          this._transformEnum(definition);
          break;
        case Kind.UNION_TYPE_DEFINITION:
          this._transformUnion(definition);
          break;
        default:
          continue;
      }
    }

    return this.context;
  }

  private _transformInterface(definition: InterfaceNode) {
    for (const plugin of this.plugins) {
      if (plugin.match(definition)) {
        plugin.execute(definition);
      }
    }

    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformField(field);
    }
  }

  private _transformObject(definition: ObjectNode) {
    // Loop over each plugins and execute the ones that matches the object
    for (const plugin of this.plugins) {
      if (plugin.match(definition)) {
        plugin.execute(definition);
      }
    }

    // Transform fields
    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformField(field);
    }
  }

  private _transformInput(definition: InputObjectNode) {
    const fields = definition.fields ?? [];
    for (const field of fields) {
      this._transformInputValue(field);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _transformEnum(definition: EnumNode) {
    // Loop over each plugins and execute the ones that matches the enum
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _transformUnion(definition: UnionNode) {
    // Loop over each plugins and execute the ones that matches the union
  }
  private _transformInputValue(definition: InputValueNode) {
    // Loop over each plugins and execute the ones that matches the input value

    // Transform default value
    const defaultValue = definition.defaultValue;
    if (defaultValue) {
      // Loop over each plugins and execute the ones that matches the default value
    }
  }

  private _transformField(definition: FieldNode) {
    // Loop over each plugins and execute the ones that matches the field

    // Transform arguments
    const args = definition.arguments ?? [];
    for (const arg of args) {
      this._transformInputValue(arg);
    }
  }
}
