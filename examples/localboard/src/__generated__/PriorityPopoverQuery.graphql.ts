/**
 * @generated SignedSource<<74fda9adcd10a9370ac08cd147889740>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PriorityPopoverQuery$variables = Record<PropertyKey, never>;
export type PriorityPopoverQuery$data = {
  readonly listPriorities: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly icon: string | null;
        readonly id: string;
        readonly title: string | null;
        readonly value: number;
      } | null;
    }>;
  };
};
export type PriorityPopoverQuery = {
  response: PriorityPopoverQuery$data;
  variables: PriorityPopoverQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "PriorityConnection",
    "kind": "LinkedField",
    "name": "listPriorities",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PriorityEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Priority",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "id",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "title",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "icon",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "value",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PriorityPopoverQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PriorityPopoverQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "d95044425f84850dfd329c3f258ba093",
    "id": null,
    "metadata": {},
    "name": "PriorityPopoverQuery",
    "operationKind": "query",
    "text": "query PriorityPopoverQuery {\n  listPriorities {\n    edges {\n      node {\n        id\n        title\n        icon\n        value\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "92a55ffd5bc44d41a23de4423303c92f";

export default node;
