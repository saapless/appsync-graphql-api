import { FieldLoaderDescriptor, PipelineFunctionLoaderDescriptor } from "../utils/types";

export class ResolverLoader {
  private readonly _fieldLoaders: Map<string, FieldLoaderDescriptor>;
  private readonly _functionLoaders: Map<string, PipelineFunctionLoaderDescriptor>;

  constructor() {
    this._fieldLoaders = new Map();
    this._functionLoaders = new Map();
  }

  public hasFieldLoader(name: string) {
    return this._fieldLoaders.has(name);
  }

  public setFieldLoader(
    typeName: string,
    fieldName: string,
    loader: Partial<FieldLoaderDescriptor>
  ) {
    const key = `${typeName}.${fieldName}`;
    const existingLoader = this._fieldLoaders.get(key);

    if (existingLoader) {
      this._fieldLoaders.set(key, { ...existingLoader, ...loader });
    } else {
      this._fieldLoaders.set(key, { ...loader, typeName, fieldName } as FieldLoaderDescriptor);
    }
  }

  public getAllFieldLoaders() {
    return Array.from(this._fieldLoaders.values());
  }

  public hasFunctionLoader(name: string) {
    return this._functionLoaders.has(name);
  }

  public setFunctionLoader(name: string, loader: Partial<PipelineFunctionLoaderDescriptor>) {
    const existingLoader = this._functionLoaders.get(name);

    if (existingLoader) {
      this._functionLoaders.set(name, { ...existingLoader, ...loader });
    } else {
      this._functionLoaders.set(name, { ...loader, name } as PipelineFunctionLoaderDescriptor);
    }
  }

  public getAllFunctionLoaders() {
    return Array.from(this._functionLoaders.values());
  }
}
