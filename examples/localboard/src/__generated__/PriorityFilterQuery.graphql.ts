/**
 * @generated SignedSource<<3b99929ad48e68579614da790c3813b0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PriorityFilterQuery$variables = Record<PropertyKey, never>;
export type PriorityFilterQuery$data = {
  readonly viewer: {
    readonly priorities: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly id: string;
          readonly " $fragmentSpreads": FragmentRefs<"PriorityFilterCommandItem_data">;
        } | null;
      }>;
    };
  };
};
export type PriorityFilterQuery = {
  response: PriorityFilterQuery$data;
  variables: PriorityFilterQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PriorityFilterQuery",
    "selections": [
      {
        "kind": "RequiredField",
        "field": {
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
                        (v0/*: any*/),
                        {
                          "args": null,
                          "kind": "FragmentSpread",
                          "name": "PriorityFilterCommandItem_data"
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
        },
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
    "name": "PriorityFilterQuery",
    "selections": [
      {
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
                      (v0/*: any*/),
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
      }
    ]
  },
  "params": {
    "cacheID": "b275c387677330e1e96c96940d547350",
    "id": null,
    "metadata": {},
    "name": "PriorityFilterQuery",
    "operationKind": "query",
    "text": "query PriorityFilterQuery {\n  viewer {\n    priorities {\n      edges {\n        node {\n          id\n          ...PriorityFilterCommandItem_data\n        }\n      }\n    }\n  }\n}\n\nfragment PriorityFilterCommandItem_data on Priority {\n  id\n  title\n  icon\n}\n"
  }
};
})();

(node as any).hash = "ea20c7a535ae07db5dcbaafee353a40f";

export default node;
