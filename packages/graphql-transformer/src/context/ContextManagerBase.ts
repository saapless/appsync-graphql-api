import { TransformerContext } from "./TransformerContext";

export abstract class ContextManagerBase {
  protected readonly _context: TransformerContext;

  constructor(context: TransformerContext) {
    this._context = context;
  }
}
