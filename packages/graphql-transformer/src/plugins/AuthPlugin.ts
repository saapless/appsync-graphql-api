import { TransformerContext } from "../context";
import { DefinitionNode, DirectiveDefinitionNode, InterfaceNode, ObjectNode } from "../parser";
import { TransformerPluginBase } from "./TransformerPluginBase";

type AuthClaimModel = {
  key: string;
  ref?: string;
  in?: string[];
  eq?: string;
};

type AuthClaimInput = AuthClaimModel | { and: AuthClaimModel[] };

export type AuthDirectiveArgs = {
  allow?: "public" | "owner";
  operations?: string[];
  provider?: "iam" | "oidc" | "userPools" | "lambda";
  claim?: AuthClaimInput | { not: AuthClaimInput } | { or: AuthClaimModel[] };
};

/**
 * Directives:
 * * `@auth(rules: [AuthRule!])`
 *
 * Actions:
 * * Handle `@auth` rules or default auth config;
 * * Handle build in aws auth rules;
 * * Add auth stages to resolvers;
 */

export class AuthPlugin extends TransformerPluginBase {
  public readonly name = "AuthPlugin";
  constructor(context: TransformerContext) {
    super(context);
  }

  public before() {
    this.context.document.addNode(
      DirectiveDefinitionNode.create("auth", ["OBJECT", "FIELD_DEFINITION", "INTERFACE"])
    );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode || definition instanceof InterfaceNode) {
      if (definition.hasDirective("auth")) {
        return true;
      }

      return definition.fields?.some((field) => field.hasDirective("auth")) ?? false;
    }

    return false;
  }

  public after() {
    this.context.document.removeNode("auth");
  }

  public execute() {
    return;
  }

  public cleanup(definition: ObjectNode | InterfaceNode): void {
    if (definition.hasDirective("auth")) {
      definition.removeDirective("auth");
    }

    for (const field of definition.fields ?? []) {
      if (field.hasDirective("auth")) {
        field.removeDirective("auth");
      }
    }
  }

  static create(context: TransformerContext) {
    return new AuthPlugin(context);
  }
}
