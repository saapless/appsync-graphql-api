import { DynamoDbGenerator, tc } from "../codegen";
import { TransformerContext } from "../context";
import { ObjectNode } from "../parser";
import { pascalCase } from "../utils/strings";
import { LoaderDescriptor } from "../utils/types";
import { FieldResolver } from "./FieldResolver";
import { FunctionResolver } from "./FunctionResolver";

export class ResolverGenerator {
  constructor(private context: TransformerContext) {}

  private _getOrCreateFieldResolver(type: string, field: string): FieldResolver {
    const key = `${type}.${field}`;
    let resolver = this.context.resolvers.get(key);

    if (!resolver) {
      resolver = new FieldResolver(type, field);
      this.context.resolvers.set(key, resolver);
    }

    return resolver as FieldResolver;
  }

  private _getOrCreateFunctionResolver(name: string): FunctionResolver {
    let resolver = this.context.resolvers.get(name);

    if (!resolver) {
      resolver = new FunctionResolver(name);
      this.context.resolvers.set(name, resolver);
    }

    return resolver as FunctionResolver;
  }

  _setContextTypes(resolver: FieldResolver | FunctionResolver, loader: LoaderDescriptor) {
    const fieldHasArgs = Boolean(
      (this.context.document.getNode(loader.typeName) as ObjectNode)?.getField(loader.fieldName)
        ?.arguments?.length
    );

    if (fieldHasArgs) {
      const argsRef = pascalCase(loader.typeName, loader.fieldName, "args");
      resolver.code
        .addImport("../schema-types", tc.named(argsRef))
        .setContextArgs({ args: tc.typeRef(argsRef) });
    }

    if (loader.typeName !== "Query" && loader.typeName !== "Mutation") {
      resolver.code
        .addImport("../schema-types", tc.named(loader.typeName))
        .setContextArgs({ source: tc.typeRef(loader.typeName) });
    }

    if (loader.action === "list") {
      resolver.code.addImport("../schema-types", tc.named("DynamoDBQueryResult"));
    }

    resolver.code.addImport("../schema-types", tc.named(loader.target.name)).setContextArgs({
      result:
        loader.action === "list"
          ? tc.typeRef("DynamoDBQueryResult", [tc.typeRef(loader.target.name)])
          : tc.typeRef(loader.target.name),
    });
  }

  public generate() {
    for (const loader of this.context.loaders.values()) {
      const resolver = this._getOrCreateFieldResolver(loader.typeName, loader.fieldName);

      if (resolver.isReadonly) {
        continue;
      }

      this._setContextTypes(resolver, loader);

      // TODO: We should instantiate the generator based on resolver.dataSource type;
      const generator = new DynamoDbGenerator(resolver.code);
      generator.generateFieldResolver(loader);
    }
  }
}
