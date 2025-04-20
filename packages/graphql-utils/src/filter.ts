import { getValue } from "./deepValue";

// Comparison Operators
type EqualsExpression = { eq: unknown };
type NotEqualsExpression = { ne: unknown };
type GreaterThanExpression = { gt: unknown };
type GreaterThanOrEqualsExpression = { ge: unknown };
type LessThanExpression = { lt: unknown };
type LessThanOrEqualsExpression = { le: unknown };

type ComparisonExpression =
  | EqualsExpression
  | NotEqualsExpression
  | GreaterThanExpression
  | GreaterThanOrEqualsExpression
  | LessThanExpression
  | LessThanOrEqualsExpression;

// Function Operators
type InExpression = { in: unknown[] };
type BetweenExpression = { between: [unknown, unknown] };
type ContainsExpression = { contains: string };
type NotContainsExpression = { notContains: string };
type BeginsWithExpression = { beginsWith: string };
type AttributeExistsExpression = { attributeExists: boolean };
type AttributeTypeExpression = { attributeType: string };
type SizeExpression = { size: ComparisonExpression | BetweenExpression };

type FunctionExpression =
  | InExpression
  | BetweenExpression
  | ContainsExpression
  | NotContainsExpression
  | BeginsWithExpression
  | AttributeExistsExpression
  | AttributeTypeExpression
  | SizeExpression;

type Expression = ComparisonExpression | FunctionExpression;

type FilterExpression =
  | {
      and?: FilterExpression[];
      or?: FilterExpression[];
      not?: FilterExpression;
    }
  | Record<string, Expression>;

function isEqualsExp(exp: Expression): exp is EqualsExpression {
  return Object.hasOwn(exp, "eq");
}

function isNotEqualsExp(exp: Expression): exp is NotEqualsExpression {
  return Object.hasOwn(exp, "ne");
}

function isGreaterThanExp(exp: Expression): exp is GreaterThanExpression {
  return Object.hasOwn(exp, "gt");
}

function isGreaterThanOrEqualsExp(exp: Expression): exp is GreaterThanOrEqualsExpression {
  return Object.hasOwn(exp, "ge");
}

function isLessThanExp(exp: Expression): exp is LessThanExpression {
  return Object.hasOwn(exp, "lt");
}

function isLessThanOrEqualsExp(exp: Expression): exp is LessThanOrEqualsExpression {
  return Object.hasOwn(exp, "le");
}

function isInExp(exp: Expression): exp is InExpression {
  return Object.hasOwn(exp, "in");
}

function isBetweenExp(exp: Expression): exp is BetweenExpression {
  return Object.hasOwn(exp, "between");
}

function isContainsExp(exp: Expression): exp is ContainsExpression {
  return Object.hasOwn(exp, "contains");
}

function isNotContainsExp(exp: Expression): exp is NotContainsExpression {
  return Object.hasOwn(exp, "notContains");
}

function isBeginsWithExp(exp: Expression): exp is BeginsWithExpression {
  return Object.hasOwn(exp, "beginsWith");
}

function isAttributeExistsExp(exp: Expression): exp is AttributeExistsExpression {
  return Object.hasOwn(exp, "attributeExists");
}

function isAttributeTypeExp(exp: Expression): exp is AttributeTypeExpression {
  return Object.hasOwn(exp, "attributeType");
}

function isSizeExp(exp: Expression): exp is SizeExpression {
  return Object.hasOwn(exp, "size");
}

// Compare two values for equality
function matchExp(value: unknown, exp: Expression): boolean {
  if (isEqualsExp(exp)) {
    return value === exp.eq;
  }

  if (isNotEqualsExp(exp)) {
    return value !== exp.ne;
  }

  if (isGreaterThanExp(exp)) {
    if (
      (typeof value === "number" && typeof exp.gt === "number") ||
      (typeof value === "string" && typeof exp.gt === "string")
    ) {
      return value > exp.gt;
    }
  }

  if (isGreaterThanOrEqualsExp(exp)) {
    if (
      (typeof value === "number" && typeof exp.ge === "number") ||
      (typeof value === "string" && typeof exp.ge === "string")
    ) {
      return value >= exp.ge;
    }
  }

  if (isLessThanExp(exp)) {
    if (
      (typeof value === "number" && typeof exp.lt === "number") ||
      (typeof value === "string" && typeof exp.lt === "string")
    ) {
      return value < exp.lt;
    }
  }

  if (isLessThanOrEqualsExp(exp)) {
    if (
      (typeof value === "number" && typeof exp.le === "number") ||
      (typeof value === "string" && typeof exp.le === "string")
    ) {
      return value <= exp.le;
    }
  }

  if (isInExp(exp)) {
    return exp.in.includes(value);
  }

  if (isBetweenExp(exp)) {
    return (
      (value as string) >= (exp.between[0] as string) &&
      (value as string) <= (exp.between[1] as string)
    );
  }

  if (isContainsExp(exp)) {
    if (typeof value === "string" || Array.isArray(value)) {
      return value.includes(exp.contains);
    }
  }

  if (isNotContainsExp(exp)) {
    if (typeof value === "string" || Array.isArray(value)) {
      return !value.includes(exp.notContains);
    }
  }

  if (isBeginsWithExp(exp)) {
    if (typeof value === "string") {
      return value.startsWith(exp.beginsWith);
    }
  }

  if (isAttributeExistsExp(exp)) {
    return exp.attributeExists ? value !== undefined : value === undefined;
  }
  if (isAttributeTypeExp(exp)) {
    return typeof value === exp.attributeType;
  }

  if (isSizeExp(exp)) {
    if (typeof value === "string" || Array.isArray(value)) {
      return matchExp(value.length, exp.size);
    }
  }

  return false;
}

function evaluate<T extends Record<string, unknown>>(
  expression: FilterExpression,
  record: T
): boolean {
  for (const [key, exp] of Object.entries(expression)) {
    if (key === "and" && Array.isArray(exp)) {
      if (!exp.every((e) => evaluate(e, record))) {
        return false;
      }
    } else if (key === "or" && Array.isArray(exp)) {
      if (!exp.some((e) => evaluate(e, record))) {
        return false;
      }
    } else if (key === "not" && typeof exp === "object" && !Array.isArray(exp)) {
      if (evaluate(exp, record)) {
        return false;
      }
    } else {
      const isNested = key.split(".").length > 1 && Boolean(getValue(record, key));

      if (isNested) {
        if (!matchExp(getValue(record, key), exp)) {
          return false;
        }
      } else if (!matchExp(record[key], exp)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filters a record based on the provided filter expression.
 * @param expression - The filter expression to apply.
 * @returns A function that takes a record or an array of records and returns true if it matches the filter expression, false otherwise.
 */

export function filterExpression<TFilter extends FilterExpression>(expression: TFilter) {
  return <TRecord>(record: TRecord): boolean => {
    if (Array.isArray(record)) {
      return record.every((r) => evaluate(expression, r));
    }

    if (typeof record === "object" && record !== null) {
      return evaluate(expression, record as Record<string, unknown>);
    }

    return false;
  };
}
