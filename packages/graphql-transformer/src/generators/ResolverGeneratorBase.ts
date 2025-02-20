import { CodeDocument, tc } from "../codegen";
import { TransformerContext } from "../context";
import { ObjectNode } from "../parser";
import { pascalCase } from "../utils/strings";
import { FieldLoaderDescriptor, Key, LoaderDescriptor } from "../utils/types";
import { parseKey } from "./utils";

export abstract class ResolverGeneratorBase {
  protected readonly code: CodeDocument;
  protected readonly context: TransformerContext;

  constructor(context: TransformerContext, code: CodeDocument) {
    this.code = code;
    this.context = context;
  }

  protected _setDefaultContextTypes(loader: FieldLoaderDescriptor) {
    const fieldHasArgs = Boolean(
      (this.context.document.getNode(loader.typeName) as ObjectNode)?.getField(loader.fieldName)
        ?.arguments?.length
    );

    if (fieldHasArgs) {
      const argsRef = pascalCase(loader.typeName, loader.fieldName, "args");
      this.code
        .addImport("../schema-types", tc.named(argsRef))
        .setContextArgs({ args: tc.typeRef(argsRef) });
    }

    if (loader.typeName !== "Query" && loader.typeName !== "Mutation") {
      this.code
        .addImport("../schema-types", tc.named(loader.typeName))
        .setContextArgs({ source: tc.typeRef(loader.typeName) });
    }
  }

  protected _getCommand() {
    return [
      tc.const("command", tc.call(tc.ref(`ctx.prev.result.commands.shift`), [])),
      tc.if(
        tc.not(tc.ref("command")),
        tc.return(
          tc.call(tc.ref("util.error"), [
            tc.str("Undefined pipeline command"),
            tc.str("PipelineCommandException"),
          ])
        )
      ),
    ];
  }

  protected _getKey(key: Key) {
    this.code.addImport("@saapless/appsync-utils", tc.named("getValueAtPath"));
    return parseKey(key);
  }

  public abstract generateTemplate(loader: LoaderDescriptor): void;
}
