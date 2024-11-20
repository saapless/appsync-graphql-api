// type Specifier =
//   | { _kind: "named"; value: string }
//   | { _kind: "default"; value: string }
//   | { _kind: "namespace"; value?: string }
//   | string;

// export function specifiers(values: Specifier[]) {
//   let _default: string | undefined = undefined;
//   let _namespace: string | undefined = undefined;
//   const _named: string[] = [];

//   for (const value of values) {
//     if (typeof value === "string") {
//       _named.push(value);
//       continue;
//     }

//     if (value._kind === "default") {
//       if (_default) throw new Error("Default specifier already exists");
//       if (_namespace) throw new Error("Default specifier cannot be used with namespace specifier");
//       _default = value.value;
//       continue;
//     }

//     if (value._kind === "namespace") {
//       if (_namespace) throw new Error("Namespace specifier already exists");
//       if (_default) throw new Error("Namespace specifier cannot be used with default specifier");
//       _namespace = value.value ? join(" ", "*", "as", value.value) : "*";
//       continue;
//     }

//     _named.push(value.value);
//   }

//   return join(
//     " ",
//     _default ?? _namespace ?? "",
//     _named.length ? wrap("{ ", join(", ", _named), " }") : ""
//   );
// }

export {};

// export function _for(initial: string, condition: string, increment: string, body: string) {
//   return join(" ", wrap("for", expression(join(" ", initial, condition, increment))), block(body));
// }

// export function _if(condition: string, body: string) {
//   return join(" ", "if", expression(condition), block(body));
// }

// export function _return(value: string) {
//   return wrap("return ", statement(value));
// }

// export function _const(name: string, value: string) {
//   return statement(join(" ", "const", name, "=", value));
// }

// export function _let(name: string, value: string) {
//   return statement(join(" ", "let", name, "=", value));
// }

// export function _throw(value: string) {
//   return wrap("throw ", statement(value));
// }

// export function _object(...properties: string[]) {
//   return block(join(",\n", properties));
// }

// export function _property(name: string, value: string) {
//   return join(" ", join("", name, ":"), value);
// }

// export function _array(...values: string[]) {
//   return wrap("[", join(", ", values), "]");
// }

// export function _param(name: string, type?: string) {
//   return join(": ", name, type ?? "");
// }

// export function _function(name: string, parameters: string[], body: string) {
//   return join(" ", "function", join("", name, wrap("(", join(", ", parameters)), ")"), block(body));
// }

// export function _call(name: string, parameters: string[]) {
//   return join("", name, wrap("(", join(", ", parameters)), ")");
// }

// export function _member(identifier: string, property: string) {
//   return join(".", identifier, property);
// }
