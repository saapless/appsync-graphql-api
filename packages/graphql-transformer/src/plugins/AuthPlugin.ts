import { TransformerContext } from "../context";
import {
  ArgumentNode,
  DefinitionNode,
  DirectiveDefinitionNode,
  DirectiveNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
  ValueNode,
} from "../parser";
import { AuthorizationRule } from "../utils/types";
import { TransformerPluginBase } from "./TransformerPluginBase";

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

  private _setDefaultDirective(node: ObjectNode) {
    const defaultAuthRule = this.context.defaultAuthorizationRule;

    if (!defaultAuthRule) return node;

    return node.addDirective(
      DirectiveNode.create("auth", [
        ArgumentNode.create("rules", ValueNode.fromValue([defaultAuthRule])),
      ])
    );
  }

  private _setFieldAuthRules(object: ObjectNode, field: FieldNode) {
    const rules: AuthorizationRule[] = [];

    if (field.hasDirective("auth")) {
      const authRule = field
        .getDirective("auth")
        ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

      if (authRule?.rules) {
        this.context.loader.setFieldLoader(object.name, field.name, {
          targetName: field.type.getTypeName(),
          auth: rules,
        });
      }
    }

    // const target = this.context.document.getNode(field.type.getTypeName());

    // if (target instanceof UnionNode) {
    //   for (const type of target.types ?? []) {
    //     const unionType = this.context.document.getNode(type.getTypeName());

    //     if (
    //       (unionType instanceof ObjectNode || unionType instanceof InterfaceNode) &&
    //       unionType.hasDirective("auth")
    //     ) {
    //       const authRule = unionType
    //         .getDirective("auth")
    //         ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    //       if (authRule?.rules) {
    //         //
    //       }
    //     }
    //   }
    // }

    // if (
    //   (target instanceof ObjectNode || target instanceof InterfaceNode) &&
    //   target.hasDirective("auth")
    // ) {
    //   const authRule = target
    //     .getDirective("auth")
    //     ?.getArgumentsJSON<{ rules: AuthorizationRule[] }>();

    //   if (authRule?.rules) {
    //     rules.push(...authRule.rules);
    //   }
    // }
  }

  public before() {
    this.context.document
      .addNode(EnumNode.create("AuthAllowStrategy", ["public", "owner"]))
      .addNode(EnumNode.create("AuthProvider", ["iam", "oidc", "userPools", "lambda"]))
      .addNode(
        InputObjectNode.create("AuthClaim", [
          InputValueNode.create("key", "String"),
          InputValueNode.create("ref", "String"),
          InputValueNode.create("eq", "String"),
          InputValueNode.create("in", ListTypeNode.create(NonNullTypeNode.create("String"))),
          InputValueNode.create("and", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
          InputValueNode.create("or", ListTypeNode.create(NonNullTypeNode.create("AuthClaim"))),
          InputValueNode.create("not", "AuthClaim"),
        ])
      )
      .addNode(
        InputObjectNode.create("AuthRule", [
          InputValueNode.create("allow", "AuthAllowStrategy"),
          InputValueNode.create(
            "operations",
            ListTypeNode.create(NonNullTypeNode.create("ModelOperation"))
          ),
          InputValueNode.create("provider", "AuthProvider"),
          InputValueNode.create("claim", "AuthClaim"),
        ])
      )
      .addNode(
        DirectiveDefinitionNode.create(
          "auth",
          ["OBJECT", "FIELD_DEFINITION", "INTERFACE"],
          [InputValueNode.create("rules", ListTypeNode.create(NonNullTypeNode.create("AuthRule")))]
        )
      );
  }

  public match(definition: DefinitionNode) {
    if (definition instanceof ObjectNode) {
      return true;
    }

    return false;
  }

  public after() {
    this.context.document
      .removeNode("auth")
      .removeNode("AuthAllowStrategy")
      .removeNode("AuthClaim")
      .removeNode("AuthProvider")
      .removeNode("AuthRule");
  }

  public normalize(definition: ObjectNode): void {
    if (definition.interfaces?.length) {
      for (const iface of definition.interfaces) {
        const ifaceNode = this.context.document.getNode(iface.name) as InterfaceNode;

        if (!ifaceNode) {
          throw new Error(`Interface ${iface.name} not found`);
        }

        const authDirective = ifaceNode.directives?.filter(
          (directive) => directive.name === "auth"
        );

        if (authDirective?.length) {
          authDirective.forEach((directive) => {
            definition.addDirective(DirectiveNode.fromDefinition(directive.serialize()));
          });
        }
      }
    } else if (!definition.hasDirective("auth") && definition.hasDirective("model")) {
      this._setDefaultDirective(definition);
    }
  }

  public execute(definition: ObjectNode) {
    if (!definition.fields?.length) {
      return;
    }

    for (const field of definition.fields) {
      this._setFieldAuthRules(definition, field);
    }
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
