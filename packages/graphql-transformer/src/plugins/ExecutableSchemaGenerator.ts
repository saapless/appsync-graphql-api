import { Kind } from "graphql";
import ts from "typescript";
import { TransformerContext } from "../context";
import {
  DefinitionNode,
  EnumNode,
  FieldNode,
  InputObjectNode,
  InputValueNode,
  InterfaceNode,
  ListTypeNode,
  NonNullTypeNode,
  ObjectNode,
  ScalarNode,
  TypeNode,
  UnionNode,
} from "../definition";
import { addImport, printDefinitions } from "../utils";
import { ScalarType, UtilityDirective } from "../constants";
import { DexieResolverGenerator } from "../generators";
import { DexieResolverTypesGenerator } from "../generators/DexieResolverGenerator/DexieResolverTypesGenerator";
import { TransformerPluginBase } from "./PluginBase";

type DependencyNode = {
  ast: ts.Node;
  dependencies: Set<string>;
};

type ExecutableSchemaGeneratorConfig = {
  /**
   * Glob source path | path[] where to look for custom resolvers
   */
  customResolverSource?: string | string[];
  /**
   * Output directory path, relative to transformer `outDir`
   */
  outDir: string;
};

export class ExecutableSchemaGenerator extends TransformerPluginBase {
  private static options: ExecutableSchemaGeneratorConfig = { outDir: "executable-schema" };

  private readonly _ast: ts.Node[];
  private readonly _depsMap: Map<string, DependencyNode>;
  private readonly _typeIds: ts.Identifier[];
  private readonly _resoverGenerator: DexieResolverGenerator;
  private readonly _typesGenerator: DexieResolverTypesGenerator;
  private readonly _config: ExecutableSchemaGeneratorConfig;

  constructor(context: TransformerContext, config: ExecutableSchemaGeneratorConfig) {
    super("ExecutableSchemaGenerator", context);

    this._config = config;
    this._ast = [];
    this._depsMap = new Map();
    this._typeIds = [];
    this._resoverGenerator = new DexieResolverGenerator(context, this._ast);
    this._typesGenerator = new DexieResolverTypesGenerator(context);
  }

  private _addDefaults() {
    this._ast.push(
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          true,
          undefined,
          ts.factory.createNamedImports([
            ts.factory.createImportSpecifier(
              false,
              undefined,
              ts.factory.createIdentifier("ResolverContext")
            ),
          ])
        ),
        ts.factory.createStringLiteral("./resolver-types")
      ),
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          true,
          undefined,
          ts.factory.createNamespaceImport(ts.factory.createIdentifier("Schema"))
        ),
        ts.factory.createStringLiteral("../schema-types")
      )
    );
  }

  private _setAst(identifier: string, ast: ts.Node) {
    const node = this._depsMap.get(identifier);

    if (node) {
      node.ast = ast;
    }
  }

  private _sortNodes() {
    const sortedNodes: ts.Node[] = [];
    const state = new WeakMap<ts.Node, "visiting" | "visited">();

    const visit = (name: string, node: DependencyNode) => {
      const ast = node.ast;
      if (state.get(ast) === "visiting") {
        return;
        // A cycle was detected in the dependency graph.
        // throw new Error(`Cycle detected at node ${name}`);
      }

      if (state.get(ast) === "visited") {
        return; // Already processed this node.
      }

      state.set(ast, "visiting");

      for (const depId of node.dependencies) {
        const depNode = this._depsMap.get(depId);

        if (!depNode) {
          throw new Error(`Dependency ${depId} for node ${name} not found`);
        }

        if (depId !== name) {
          visit(depId, depNode);
        }
      }

      state.set(ast, "visited");
      sortedNodes.push(ast);
    };

    for (const [key, value] of this._depsMap) {
      if (!state.has(value.ast)) {
        visit(key, value);
      }
    }

    this._ast.push(...sortedNodes);
  }

  private _declareType(name: string, type: string, typeArgs?: ts.TypeNode[]) {
    this._ast.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(name),
              undefined,
              ts.factory.createTypeReferenceNode(type, typeArgs),
              undefined
            ),
          ],
          ts.NodeFlags.Let
        )
      )
    );
  }

  private _createAssignment(
    name: string,
    identifier: string,
    props: ts.ObjectLiteralElementLike[]
  ) {
    return ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createIdentifier(name),
        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
        ts.factory.createNewExpression(ts.factory.createIdentifier(identifier), undefined, [
          ts.factory.createObjectLiteralExpression(props),
        ])
      )
    );
  }

  private _createFieldType(type: TypeNode, deps: Set<string>): ts.Expression {
    if (type instanceof NonNullTypeNode) {
      addImport(
        this._ast,
        "graphql",
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier("GraphQLNonNull")
        )
      );

      return ts.factory.createNewExpression(
        ts.factory.createIdentifier("GraphQLNonNull"),
        undefined,
        [this._createFieldType(type.type, deps)]
      );
    }

    if (type instanceof ListTypeNode) {
      addImport(
        this._ast,
        "graphql",
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier("GraphQLList")
        )
      );

      return ts.factory.createNewExpression(ts.factory.createIdentifier("GraphQLList"), undefined, [
        this._createFieldType(type.type, deps),
      ]);
    }

    if (Object.values<string>(ScalarType).includes(type.name)) {
      const scalarName = `GraphQL${type.name}`;
      addImport(
        this._ast,
        "graphql",
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(scalarName))
      );

      return ts.factory.createIdentifier(scalarName);
    }

    deps.add(type.name);
    return ts.factory.createIdentifier(type.name);
  }

  private _createInputValueField(
    input: InputObjectNode | ObjectNode | InterfaceNode,
    field: InputValueNode
  ) {
    const dependencies = this._depsMap.get(input.name)!.dependencies;
    const props: ts.ObjectLiteralElementLike[] = [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("type"),
        this._createFieldType(field.type, dependencies)
      ),
    ];

    return ts.factory.createPropertyAssignment(
      field.name,
      ts.factory.createObjectLiteralExpression(props)
    );
  }

  private _createObjectField(object: ObjectNode | InterfaceNode, field: FieldNode) {
    const dependencies = this._depsMap.get(object.name)!.dependencies;
    const props: ts.ObjectLiteralElementLike[] = [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("type"),
        this._createFieldType(field.type, dependencies)
      ),
    ];

    if (field.arguments?.length) {
      const args: ts.ObjectLiteralElementLike[] = field.arguments.map((arg) => {
        return this._createInputValueField(object, arg);
      });

      props.push(
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("args"),
          ts.factory.createObjectLiteralExpression(args)
        )
      );
    }

    const resolverDescriptor = this.context.resolvers.getLoader(object.name, field.name);
    if (resolverDescriptor) {
      this._typesGenerator.generate(resolverDescriptor);
      const resolver = this._resoverGenerator.generate(resolverDescriptor);

      props.push(
        ts.factory.createPropertyAssignment(ts.factory.createIdentifier("resolve"), resolver)
      );
    }

    return ts.factory.createPropertyAssignment(
      field.name,
      ts.factory.createObjectLiteralExpression(props)
    );
  }

  private _createObject(definition: ObjectNode | InterfaceNode) {
    const identifier =
      definition instanceof InterfaceNode ? "GraphQLInterfaceType" : "GraphQLObjectType";

    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(identifier))
    );

    this._declareType(
      definition.name,
      identifier,
      definition instanceof ObjectNode
        ? [
            definition.name === "Query" || definition.name === "Mutation"
              ? ts.factory.createTypeReferenceNode("undefined")
              : ts.factory.createTypeReferenceNode(`Schema.${definition.name}`),
            ts.factory.createTypeReferenceNode("ResolverContext"),
          ]
        : undefined
    );

    const dependencies = this._depsMap.get(definition.name)!.dependencies;

    const fields: ts.ObjectLiteralElementLike[] = [];

    for (const field of definition.fields ?? []) {
      if (
        !field.hasDirective(UtilityDirective.SERVER_ONLY) &&
        !field.hasDirective(UtilityDirective.FILTER_ONLY) &&
        !field.hasDirective(UtilityDirective.WRITE_ONLY)
      ) {
        fields.push(this._createObjectField(definition, field));
      }
    }

    const ifaces: ts.Expression[] =
      definition.interfaces?.map((iface) => {
        return this._createFieldType(iface, dependencies);
      }) ?? [];

    const props: ts.ObjectLiteralElementLike[] = [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("name"),
        ts.factory.createStringLiteral(definition.name)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("fields"),
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createParenthesizedExpression(ts.factory.createObjectLiteralExpression(fields))
        )
      ),
    ];

    if (ifaces.length > 0) {
      props.push(
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("interfaces"),
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createParenthesizedExpression(
              ts.factory.createArrayLiteralExpression(ifaces)
            )
          )
        )
      );
    }

    this._setAst(definition.name, this._createAssignment(definition.name, identifier, props));
  }

  private _createInput(definition: InputObjectNode) {
    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("GraphQLInputObjectType")
      )
    );

    this._declareType(definition.name, "GraphQLInputObjectType");

    const fields: ts.ObjectLiteralElementLike[] =
      definition.fields?.map((field) => this._createInputValueField(definition, field)) ?? [];

    const props: ts.ObjectLiteralElementLike[] = [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("name"),
        ts.factory.createStringLiteral(definition.name)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("fields"),
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createParenthesizedExpression(ts.factory.createObjectLiteralExpression(fields))
        )
      ),
    ];

    this._setAst(
      definition.name,
      this._createAssignment(definition.name, "GraphQLInputObjectType", props)
    );
  }

  private _createUnion(definition: UnionNode) {
    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("GraphQLUnionType")
      )
    );

    this._declareType(definition.name, "GraphQLUnionType");

    const types: ts.Identifier[] = [];

    for (const type of definition.types ?? []) {
      this._depsMap.get(definition.name)?.dependencies.add(type.name);
      types.push(ts.factory.createIdentifier(type.name));
    }

    this._setAst(
      definition.name,
      this._createAssignment(definition.name, "GraphQLUnionType", [
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("name"),
          ts.factory.createStringLiteral(definition.name)
        ),
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("types"),
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createParenthesizedExpression(ts.factory.createArrayLiteralExpression(types))
          )
        ),
      ])
    );
  }

  private _createEnum(definition: EnumNode) {
    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("GraphQLEnumType")
      )
    );

    const values: ts.ObjectLiteralElementLike[] = [];

    for (const value of definition.values ?? []) {
      values.push(
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier(value.name),
          ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("value"),
              ts.factory.createStringLiteral(value.name)
            ),
          ])
        )
      );
    }

    this._setAst(
      definition.name,
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(definition.name),
              undefined,
              undefined,
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("GraphQLEnumType"),
                undefined,
                [
                  ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier("name"),
                      ts.factory.createStringLiteral(definition.name)
                    ),
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier("values"),
                      ts.factory.createObjectLiteralExpression(values)
                    ),
                  ]),
                ]
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );
  }

  private _createScalar(definition: ScalarNode) {
    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("GraphQLScalarType")
      )
    );

    this._setAst(
      definition.name,
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(definition.name),
              undefined,
              undefined,
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("GraphQLScalarType"),
                undefined,
                [
                  ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier("name"),
                      ts.factory.createStringLiteral(definition.name)
                    ),
                  ]),
                ]
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );
  }

  private _createSchema() {
    addImport(
      this._ast,
      "graphql",
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier("GraphQLSchema")
      )
    );

    const schemaProps: ts.ObjectLiteralElementLike[] = [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("query"),
        ts.factory.createIdentifier("Query")
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("mutation"),
        ts.factory.createIdentifier("Mutation")
      ),
    ];

    if (this._typeIds.length > 0) {
      schemaProps.push(
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("types"),
          ts.factory.createArrayLiteralExpression(this._typeIds)
        )
      );
    }

    this._ast.push(
      ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier("schema"),
              undefined,
              undefined,
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("GraphQLSchema"),
                undefined,
                [ts.factory.createObjectLiteralExpression(schemaProps, true)]
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      )
    );
  }

  public before(): void {
    this._addDefaults();
  }

  public match(definition: DefinitionNode): boolean {
    switch (definition.kind) {
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.OBJECT_TYPE_DEFINITION:
      case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      case Kind.ENUM_TYPE_DEFINITION:
      case Kind.SCALAR_TYPE_DEFINITION:
      case Kind.UNION_TYPE_DEFINITION:
        return definition.hasDirective(UtilityDirective.INTERNAL) ? false : true;
      default:
        return false;
    }
  }

  public execute(definition: DefinitionNode): void {
    this._depsMap.set(definition.name, {
      ast: ts.factory.createEmptyStatement(),
      dependencies: new Set(),
    });

    if (definition.name !== "Query" && definition.name !== "Mutation") {
      this._typeIds.push(ts.factory.createIdentifier(definition.name));
    }

    switch (definition.kind) {
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.OBJECT_TYPE_DEFINITION:
        this._createObject(definition);
        break;
      case Kind.INPUT_OBJECT_TYPE_DEFINITION:
        this._createInput(definition);
        break;
      case Kind.UNION_TYPE_DEFINITION:
        this._createUnion(definition);
        break;
      case Kind.ENUM_TYPE_DEFINITION:
        this._createEnum(definition);
        break;
      case Kind.SCALAR_TYPE_DEFINITION:
        this._createScalar(definition);
        break;
      default:
        return;
    }
  }

  public generate(): void {
    this._sortNodes();
    this._createSchema();

    this._typesGenerator.print(`${this._config.outDir}/resolver-types.ts`);

    const header = "/* eslint-disable */\n";
    const result = header.concat(printDefinitions(this._ast, `schema.ts`));

    return this.context.printScript(`${this._config.outDir}/schema.ts`, result);
  }

  public static config(options: Partial<ExecutableSchemaGeneratorConfig>) {
    ExecutableSchemaGenerator.options = { ...options, ...ExecutableSchemaGenerator.options };
  }

  public static create(context: TransformerContext) {
    const config = ExecutableSchemaGenerator.options;
    return new ExecutableSchemaGenerator(context, config);
  }
}
