const WORD_MATCH_EXP = /(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])|(?<=[A-Za-z])(?=[^A-Za-z])/;

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
    .map(capitalize)
    .join("");
}

export function camelCase(...string: string[]): string {
  return normalize(...string)
    .filter(Boolean)
    .map((s, i) => (i === 0 ? s.toLowerCase() : capitalize(s)))
    .join("");
}

const PLURAL_RULES: [RegExp, string][] = [
  [/s?$/i, "s"],
  [/([^aeiou]ese)$/i, "$1"],
  [/(ax|test)is$/i, "$1es"],
  [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, "$1es"],
  [/(e[mn]u)s?$/i, "$1s"],
  [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, "$1"],
  [/(alumn|syllab|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, "$1i"],
  [/(alumn|alg|vertebr)(?:a|ae)$/i, "$1ae"],
  [/(seraph|cherub)(?:im)?$/i, "$1im"],
  [/(her|at|gr)o$/i, "$1oes"],
  [
    /(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i,
    "$1a",
  ],
  [
    /(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i,
    "$1a",
  ],
  [/sis$/i, "ses"],
  [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, "$1$2ves"],
  [/([^aeiouy]|qu)y$/i, "$1ies"],
  [/([^ch][ieo][ln])ey$/i, "$1ies"],
  [/(x|ch|ss|sh|zz)$/i, "$1es"],
  [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, "$1ices"],
  [/\b((?:tit)?m|l)(?:ice|ouse)$/i, "$1ice"],
  [/(pe)(?:rson|ople)$/i, "$1ople"],
  [/(child)(?:ren)?$/i, "$1ren"],
  [/eaux$/i, "$0"],
  [/m[ae]n$/i, "men"],
  [/^thou$/i, "you"],
];

function getPluralRule(word: string) {
  for (const rule of [...PLURAL_RULES].reverse()) {
    if (rule[0].test(word)) {
      return rule;
    }
  }

  return null;
}

export function pluralize(word: string) {
  const rule = getPluralRule(word);
  if (!rule) {
    return word;
  }

  return word.replace(rule[0], (...args) => {
    return rule[1].replace(/\$(\d{1,2})/g, (m, i) => {
      // eslint-disable-next-line security/detect-object-injection
      return args[i] || "";
    });
  });
}
