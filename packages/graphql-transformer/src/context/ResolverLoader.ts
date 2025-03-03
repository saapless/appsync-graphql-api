import { FieldLoaderDescriptor } from "../utils/types";

export class ResolverLoader {
  private readonly _loaders: Map<string, FieldLoaderDescriptor>;

  constructor() {
    this._loaders = new Map();
  }

  public hasLoader(name: string) {
    return this._loaders.has(name);
  }

  public setLoader(typeName: string, fieldName: string, loader: Partial<FieldLoaderDescriptor>) {
    const key = `${typeName}.${fieldName}`;
    const existingLoader = this._loaders.get(key);

    if (existingLoader) {
      this._loaders.set(key, { ...existingLoader, ...loader });
    } else {
      this._loaders.set(key, { ...loader, typeName, fieldName } as FieldLoaderDescriptor);
    }
  }

  public getAllLoaders() {
    return Array.from(this._loaders.values());
  }
}
