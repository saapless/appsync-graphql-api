export function filterExpression<
  TFilter extends Record<string, unknown>,
  TRecord extends Record<string, unknown>,
>(expression: TFilter) {
  return (record: TRecord): boolean => {
    const keys = Object.keys(expression);
    return Boolean(record && keys.length);
  };
}
