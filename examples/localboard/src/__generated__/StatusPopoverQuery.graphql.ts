/**
 * @generated SignedSource<<c964f6ce82eb94f89a84b987c7f085df>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type StatusPopoverQuery$variables = Record<PropertyKey, never>;
export type StatusPopoverQuery$data = {
  readonly viewer: {
    readonly statuses: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly id: string;
        } | null;
      }>;
    };
  };
};
export type StatusPopoverQuery = {
  response: StatusPopoverQuery$data;
  variables: StatusPopoverQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "concreteType": "Viewer",
  "kind": "LinkedField",
  "name": "viewer",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "StatusConnection",
      "kind": "LinkedField",
      "name": "statuses",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "StatusEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "Status",
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
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "StatusPopoverQuery",
    "selections": [
      {
        "kind": "RequiredField",
        "field": (v0/*: any*/),
        "action": "THROW"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "StatusPopoverQuery",
    "selections": [
      (v0/*: any*/)
    ]
  },
  "params": {
    "cacheID": "91c9a6cfd3ab21268e6fdab9decd71a7",
    "id": null,
    "metadata": {},
    "name": "StatusPopoverQuery",
    "operationKind": "query",
    "text": "query StatusPopoverQuery {\n  viewer {\n    statuses {\n      edges {\n        node {\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f659ee63db6ebf29c44dd7008da11bf9";

export default node;
