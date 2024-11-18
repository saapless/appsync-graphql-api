import {
  BooleanValueNode,
  ConstValueNode,
  FloatValueNode,
  IntValueNode,
  Kind,
  StringValueNode,
  EnumValueNode,
  ListValueNode,
  ObjectValueNode,
} from "graphql";

export type ValueType =
  | string
  | number
  | boolean
  | null
  | { [key: string]: ValueType }
  | ValueType[];

/**
 * TODO:
 * Maybe create an instance so we can call `getValue`
 * in order to parse arguments as JSON object;
 */

export class ValueNode {
  static string(value: string): StringValueNode {
    return {
      kind: Kind.STRING,
      value,
    };
  }

  static boolean(value: boolean): BooleanValueNode {
    return {
      kind: Kind.BOOLEAN,
      value,
    };
  }

  static int(value: number): IntValueNode {
    return {
      kind: Kind.INT,
      value: value.toString(),
    };
  }

  static float(value: number): FloatValueNode {
    return {
      kind: Kind.FLOAT,
      value: value.toString(),
    };
  }

  static null() {
    return {
      kind: Kind.NULL,
    };
  }

  static enum(value: string): EnumValueNode {
    return {
      kind: Kind.ENUM,
      value,
    };
  }

  static list(values: ConstValueNode[]): ListValueNode {
    return {
      kind: Kind.LIST,
      values,
    };
  }

  static object(values: { [key: string]: ConstValueNode }): ObjectValueNode {
    return {
      kind: Kind.OBJECT,
      fields: Object.entries(values).map(([key, value]) => ({
        kind: Kind.OBJECT_FIELD,
        name: {
          kind: Kind.NAME,
          value: key,
        },
        value,
      })),
    };
  }

  static getValue(node: ConstValueNode): ValueType {
    switch (node.kind) {
      case Kind.STRING:
        return node.value;
      case Kind.BOOLEAN:
        return node.value;
      case Kind.INT:
        return parseInt(node.value);
      case Kind.FLOAT:
        return parseFloat(node.value);
      case Kind.NULL:
        return null;
      case Kind.ENUM:
        return node.value;
      case Kind.LIST:
        return node.values.map((value) => ValueNode.getValue(value));
      case Kind.OBJECT:
        return node.fields.reduce(
          (acc, field) => {
            acc[field.name.value] = ValueNode.getValue(field.value);
            return acc;
          },
          {} as { [key: string]: ValueType }
        );
      default:
        return null;
    }
  }
}
