/**
 * @generated SignedSource<<f9bad94035225b13481b1af543c79ec9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PriorityPopoverQuery$variables = Record<PropertyKey, never>;
export type PriorityPopoverQuery$data = {
  readonly viewer: {
    readonly priorities: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly icon: string | null;
          readonly id: string;
          readonly title: string | null;
        } | null;
      }>;
    };
  };
};
export type PriorityPopoverQuery = {
  response: PriorityPopoverQuery$data;
  variables: PriorityPopoverQuery$variables;
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
      "concreteType": "PriorityConnection",
      "kind": "LinkedField",
      "name": "priorities",
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
    "name": "PriorityPopoverQuery",
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
    "name": "PriorityPopoverQuery",
    "selections": [
      (v0/*: any*/)
    ]
  },
  "params": {
    "cacheID": "d83fe990498618d846fa58f7a68f888e",
    "id": null,
    "metadata": {},
    "name": "PriorityPopoverQuery",
    "operationKind": "query",
    "text": "query PriorityPopoverQuery {\n  viewer {\n    priorities {\n      edges {\n        node {\n          id\n          title\n          icon\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e3088740a83229540c870448a1d8d199";

export default node;
