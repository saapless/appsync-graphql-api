const WORD_MATCH_EXP = /(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])|(?<=[A-Za-z])(?=[^A-Za-z])/;

function normalize(...string: string[]): string[] {
  return string
    .map((s) => s.split(/[-_\s\b\W]/))
    .filter(Boolean)
    .flat()
    .map((s) => s.split(WORD_MATCH_EXP))
    .flat()
    .map((s) => s.toLowerCase());
}

export function pascalCase(...string: string[]): string {
  return normalize(...string)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function camelCase(...string: string[]): string {
  const pascal = pascalCase(...string);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
