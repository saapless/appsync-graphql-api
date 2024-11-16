export function wrap(start: string, value: string, end = "") {
  return `${start}${value}${end}`;
}

export function indent(value: string) {
  return value
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

export function join<T extends (string | string[])[]>(separator = "", ...statements: T) {
  return statements.flat().filter(Boolean).join(separator);
}

export function block<T extends string[]>(...value: T) {
  return wrap("{\n", indent(join("\n", value)).trimEnd(), "\n}\n");
}

export function expression(value: string) {
  return wrap("(", value, ")");
}

export function statement(value: string) {
  return wrap("", value, `${value.endsWith(";") ? "" : ";"}\n`);
}

export function returnStatement(value: string) {
  return wrap("return ", statement(value));
}
