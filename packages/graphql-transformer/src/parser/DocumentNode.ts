import { DocumentNode as DocumentDefinitionNode, Kind, parse, Source } from "graphql";
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

  public serialize(): DocumentDefinitionNode {
    return {
      kind: Kind.DOCUMENT,
      definitions: this.definitions.map((definition) => definition.serialize()),
    };
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

  static fromDefinition(definition: DocumentDefinitionNode) {
    const { definitions } = definition;
    const document = new DocumentNode([]);

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
        default:
          continue;
      }
    }

    return document;
  }

  static fromSource(source: string | Source) {
    const { kind, definitions } = parse(source);
    return DocumentNode.fromDefinition({ kind, definitions });
  }
}
