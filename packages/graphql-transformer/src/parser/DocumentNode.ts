import {
  DocumentNode as DocumentDefinitionNode,
  Kind,
  parse,
  print,
  Source,
  TypeExtensionNode,
} from "graphql";
import { validateSDL } from "graphql/validation/validate";
import { ObjectNode } from "./ObjectNode";
import { InputObjectNode } from "./InputObjectNode";
import { InterfaceNode } from "./InterfaceNode";
import { EnumNode } from "./EnumNode";
import { UnionNode } from "./UnionNode";
import { ScalarNode } from "./ScalarNode";
import { DirectiveDefinitionNode } from "./DirectiveDefinitionNode";

export type DefinitionNode =
  | InterfaceNode
  | ObjectNode
  | InputObjectNode
  | EnumNode
  | UnionNode
  | ScalarNode
  | DirectiveDefinitionNode;

export class DocumentNode {
  kind: Kind.DOCUMENT = Kind.DOCUMENT;
  definitions: DefinitionNode[];

  constructor(definitions: DefinitionNode[] = []) {
    this.definitions = definitions;
  }

  public hasNode(name: string) {
    return this.definitions.some((definition) => definition.name === name);
  }

  public getNode(name: string) {
    return this.definitions.find((definition) => definition.name === name);
  }

  public addNode(node: DefinitionNode) {
    if (this.hasNode(node.name)) {
      throw new Error(`Node with name ${node.name} already exists`);
    }

    this.definitions.push(node);
    return this;
  }

  public removeNode(name: string) {
    this.definitions = this.definitions.filter((definition) => definition.name !== name);
    return this;
  }

  public validate() {
    const document = this.serialize();
    const errors = validateSDL(document);
    return errors;
  }

  public print() {
    return print(this.serialize());
  }

  public serialize(): DocumentDefinitionNode {
    return {
      kind: Kind.DOCUMENT,
      definitions: this.definitions.map((definition) => definition.serialize()),
    };
  }

  static fromDefinition(definition: DocumentDefinitionNode) {
    const { definitions } = definition;
    const document = new DocumentNode([]);

    const extensions: TypeExtensionNode[] = [];

    for (const definition of definitions) {
      switch (definition.kind) {
        case Kind.SCALAR_TYPE_DEFINITION:
          document.addNode(ScalarNode.fromDefinition(definition));
          break;
        case Kind.DIRECTIVE_DEFINITION:
          document.addNode(DirectiveDefinitionNode.fromDefinition(definition));
          break;
        case Kind.OBJECT_TYPE_DEFINITION:
          document.addNode(ObjectNode.fromDefinition(definition));
          break;
        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
          document.addNode(InputObjectNode.fromDefinition(definition));
          break;
        case Kind.INTERFACE_TYPE_DEFINITION:
          document.addNode(InterfaceNode.fromDefinition(definition));
          break;
        case Kind.ENUM_TYPE_DEFINITION:
          document.addNode(EnumNode.fromDefinition(definition));
          break;
        case Kind.UNION_TYPE_DEFINITION:
          document.addNode(UnionNode.fromDefinition(definition));
          break;
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INPUT_OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.ENUM_TYPE_EXTENSION:
        case Kind.UNION_TYPE_EXTENSION:
        case Kind.SCALAR_TYPE_EXTENSION:
          extensions.push(definition);
          break;
        default:
          continue;
      }
    }

    // Since we don't know in which order documents may be loaded,
    // we need to make sure we lod extensions ad the end.

    for (const extension of extensions) {
      const node = document.getNode(extension.name.value);
      if (node instanceof ObjectNode && extension.kind === Kind.OBJECT_TYPE_EXTENSION) {
        node.extend(extension);
      } else if (
        node instanceof InputObjectNode &&
        extension.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION
      ) {
        node.extend(extension);
      } else if (
        node instanceof InterfaceNode &&
        extension.kind === Kind.INTERFACE_TYPE_EXTENSION
      ) {
        node.extend(extension);
      } else if (node instanceof EnumNode && extension.kind === Kind.ENUM_TYPE_EXTENSION) {
        node.extend(extension);
      } else if (node instanceof UnionNode && extension.kind === Kind.UNION_TYPE_EXTENSION) {
        node.extend(extension);
      } else if (node instanceof ScalarNode && extension.kind === Kind.SCALAR_TYPE_EXTENSION) {
        node.extend(extension);
      }
    }

    return document;
  }

  static fromSource(source: string | Source) {
    const { kind, definitions } = parse(source);
    return DocumentNode.fromDefinition({ kind, definitions });
  }
}
