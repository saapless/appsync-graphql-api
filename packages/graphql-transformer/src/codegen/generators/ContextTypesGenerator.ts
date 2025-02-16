import { TransformerContext } from "../../context";
import { ObjectNode } from "../../parser";
import { pascalCase } from "../../utils/strings";
import { FieldLoaderDescriptor } from "../../utils/types";
import { CodeDocument, tc } from "../code";

export class ContextTypesGenerator {
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
}
