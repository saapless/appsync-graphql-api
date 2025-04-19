import { ConstDirectiveNode } from "graphql";
import { DirectiveNode } from "./DirectiveNode";

export class WithDirectivesNode {
  name: string;
  directives?: DirectiveNode[] | undefined;

  constructor(name: string, directives?: DirectiveNode[]) {
    this.name = name;
    this.directives = directives;
  }

  public hasDirective(name: string) {
    return this.directives?.some((directive) => directive.name === name) ?? false;
  }

  public getDirective(name: string) {
    return this.directives?.find((directive) => directive.name === name);
  }

  public addDirective(directive: string | DirectiveNode | ConstDirectiveNode) {
    const node =
      directive instanceof DirectiveNode
        ? directive
        : typeof directive === "string"
          ? DirectiveNode.create(directive)
          : DirectiveNode.fromDefinition(directive);

    if (this.hasDirective(node.name)) {
      throw new Error(`Directive ${node.name} already exists on node ${this.name}`);
    }

    this.directives = this.directives ?? [];
    this.directives.push(node);
    return this;
  }

  public removeDirective(name: string) {
    this.directives = this.directives?.filter((directive) => directive.name !== name);
    return this;
  }
}

// export class WithArgumentsNode {
//   name: string;
//   arguments?: InputValueNode[] | undefined;

//   constructor(name: string, args?: InputValueNode[]) {
//     this.name = name;
//     this.arguments = args;
//   }

//   public hasArgument(name: string) {
//     return this.arguments?.some((arg) => arg.name === name) ?? false;
//   }

//   public getArgument(arg: string) {
//     return this.arguments?.find((argument) => argument.name === arg);
//   }

//   public addArgument(argument: InputValueNode | InputValueDefinitionNode) {
//     const node =
//       argument instanceof InputValueNode ? argument : InputValueNode.fromDefinition(argument);

//     if (this.hasArgument(node.name)) {
//       throw new Error(`Argument ${node.name} already exists on node ${this.name}`);
//     }

//     this.arguments = this.arguments ?? [];
//     this.arguments.push(node);
//     return this;
//   }

//   public removeArgument(name: string) {
//     this.arguments = this.arguments?.filter((arg) => arg.name !== name);
//     return this;
//   }
// }
