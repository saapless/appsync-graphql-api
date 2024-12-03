import { tc } from "./ast";

export function putItem(typename: string) {
  return [
    tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
    tc.const("id", tc.coalesce(tc.ref("input.id"), tc.call(tc.ref("util.autoId"), []))),
    tc.const(
      "createdAt",
      tc.coalesce(tc.ref("input.createdAt"), tc.call(tc.ref("util.time.nowISO8601"), []))
    ),
    tc.const(
      "item",
      tc.obj(tc.spread("input"), {
        id: tc.ref("id"),
        createdAt: tc.ref("createdAt"),
        updatedAt: tc.coalesce(tc.ref("input.updatedAt"), tc.ref("createdAt")),
        __typename: tc.str(typename),
        _version: tc.coalesce(tc.ref("input._version"), tc.num(1)),
        _sk: tc.tick(`${typename}\${id}`),
      })
    ),
    tc.return(
      tc.call(
        tc.ref("ddb.put"),
        tc.obj({
          key: tc.obj({ id: tc.ref("item.id") }),
          item: tc.ref("item"),
          condition: tc.obj({
            id: tc.obj({
              attributeExists: tc.bool(false),
            }),
          }),
        })
      )
    ),
  ];
}

export function updateItem() {
  return [
    tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
    tc.const(
      "updatedAt",
      tc.coalesce(tc.ref("input.updatedAt"), tc.call(tc.ref("util.time.nowISO8601"), []))
    ),
    tc.const(
      "attributes",
      tc.obj(tc.spread("input"), {
        id: tc.ref("input.id"),
        updatedAt: tc.ref("updatedAt"),
      })
    ),
    tc.const(
      "item",
      tc.obj({ _version: tc.call(tc.ref("ddb.operations.increment"), [tc.num(1)]) })
    ),
    tc.forOf(
      tc.const(tc.arr(tc.ref("key"), tc.ref("value"))),
      tc.call(tc.ref("Object.entries"), [tc.ref("attributes")]),
      tc.assign(tc.ref("item[key]"), tc.call(tc.ref("ddb.operations.replace"), [tc.ref("value")]))
    ),
    tc.return(
      tc.call(
        tc.ref("ddb.update"),
        tc.obj({
          key: tc.obj({ id: tc.ref("input.id") }),
          item: tc.ref("item"),
          condition: tc.obj({
            id: tc.obj({
              attributeExists: tc.bool(true),
            }),
            _version: tc.obj({ eq: tc.ref("input._version") }),
          }),
        })
      )
    ),
  ];
}

export function deleteItem() {
  return [
    tc.const(tc.obj(tc.ref("input")), tc.ref("ctx.args")),
    tc.return(
      tc.call(
        tc.ref("ddb.update"),
        tc.obj({
          key: tc.obj({ id: tc.ref("input.id") }),
          item: tc.obj({
            updatedAt: tc.call(tc.ref("ddb.operations.replace"), [
              tc.call(tc.ref("util.time.nowISO8601"), []),
            ]),
            _version: tc.call(tc.ref("ddb.operations.increment"), [tc.num(1)]),
            _deleted: tc.call(tc.ref("ddb.operations.replace"), [tc.bool(true)]),
          }),
          condition: tc.obj({
            id: tc.obj({ attributeExists: tc.bool(true) }),
            _version: tc.obj({ eq: tc.ref("input._version") }),
          }),
        })
      )
    ),
  ];
}

export function getItem(key: string, ref: string) {
  return [
    tc.return(
      tc.call(
        tc.ref("ddb.get"),
        tc.obj({
          key: tc.obj({ [key]: tc.chain("ctx", ref) }),
        })
      )
    ),
  ];
}

export function queryItems(key: string, ref: string, index: string | null) {
  return [
    tc.return(
      tc.call(
        tc.ref("ddb.query"),
        tc.obj({
          query: tc.obj({ [key]: tc.obj({ eq: tc.ref(`ctx.${ref}`) }) }),
          filter: tc.ref("ctx.args.filter"),
          limit: tc.coalesce(tc.ref("ctx.args.first"), tc.num(100)),
          nextToken: tc.coalesce(tc.ref("ctx.args.after"), tc.undef()),
          scanIndexForward: tc.eq(tc.ref("ctx.args.sortDirection"), tc.str("ASC")),
          index: index ? tc.str(index) : tc.undef(),
        })
      )
    ),
  ];
}
