/**
 * @generated SignedSource<<8cef296167bc20a94be6a8b215d43b01>>
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
          readonly icon: string | null;
          readonly id: string;
          readonly title: string | null;
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
    "cacheID": "1ccc464205df5afbfb1845c31f04d2fc",
    "id": null,
    "metadata": {},
    "name": "StatusPopoverQuery",
    "operationKind": "query",
    "text": "query StatusPopoverQuery {\n  viewer {\n    statuses {\n      edges {\n        node {\n          id\n          title\n          icon\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "edc6648cda3d9d4cf07adea333293b0b";

export default node;
