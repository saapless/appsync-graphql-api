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
type SizeExpression = { size: ComparisonExpression & BetweenExpression };

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
    return (value as string) > (exp.gt as string);
  }

  if (isGreaterThanOrEqualsExp(exp)) {
    return (value as string) >= (exp.ge as string);
  }

  if (isLessThanExp(exp)) {
    return (value as string) < (exp.lt as string);
  }

  if (isLessThanOrEqualsExp(exp)) {
    return (value as string) <= (exp.le as string);
  }

  if (isInExp(exp)) {
    return (exp.in as unknown[]).includes(value);
  }

  if (isBetweenExp(exp)) {
    return (
      (value as string) >= (exp.between[0] as string) &&
      (value as string) <= (exp.between[1] as string)
    );
  }

  if (isContainsExp(exp)) {
    return (value as string).includes(exp.contains);
  }

  if (isNotContainsExp(exp)) {
    return !(value as string).includes(exp.notContains);
  }

  if (isBeginsWithExp(exp)) {
    return (value as string).startsWith(exp.beginsWith);
  }

  if (isAttributeExistsExp(exp)) {
    return exp.attributeExists ? value !== undefined : value === undefined;
  }
  if (isAttributeTypeExp(exp)) {
    return typeof value === exp.attributeType;
  }

  if (isSizeExp(exp)) {
    return matchExp((value as string[]).length, exp.size);
  }

  return value === exp;
}

function evaluate(exp: Record<string, Expression>, record: Record<string, unknown>) {
  for (const [key, value] of Object.entries(exp)) {
    if (!matchExp(record[key], value)) {
      return false;
    }
  }

  return true;
}

export function filterExpression<
  TFilter extends Record<string, Expression>,
  TRecord extends Record<string, unknown>,
>(expression: TFilter) {
  return (record: TRecord): boolean => {
    for (const [key, exp] of Object.entries(expression)) {
      if (key === "and" && Array.isArray(exp)) {
        return exp.every((e) => evaluate(e, record));
      }

      if (key === "or" && Array.isArray(exp)) {
        return exp.some((e) => evaluate(e, record));
      }

      if (key === "not" && typeof exp === "object" && !Array.isArray(exp)) {
        return !evaluate(exp as Record<string, Expression>, record);
      }
    }

    return evaluate(expression, record);
  };
}
