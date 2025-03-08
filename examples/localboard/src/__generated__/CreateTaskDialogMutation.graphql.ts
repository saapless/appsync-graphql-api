/**
 * @generated SignedSource<<3fd245753a75065b4b85b14d48d4bcf2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTaskInput = {
  createdAt?: string | null;
  id: string;
  priorityId?: string | null;
  sourceId?: string | null;
  statusId?: string | null;
  title?: string | null;
  updatedAt?: string | null;
};
export type CreateTaskDialogMutation$variables = {
  connectionKeys: ReadonlyArray<string>;
  input: CreateTaskInput;
};
export type CreateTaskDialogMutation$data = {
  readonly createTask: {
    readonly id: string;
    readonly title: string;
  } | null;
};
export type CreateTaskDialogMutation = {
  response: CreateTaskDialogMutation$data;
  variables: CreateTaskDialogMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "connectionKeys"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v2 = [
  {
    "kind": "Variable",
    "name": "input",
    "variableName": "input"
  }
],
v3 = {
  "alias": null,
  "args": (v2/*: any*/),
  "concreteType": "Task",
  "kind": "LinkedField",
  "name": "createTask",
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
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CreateTaskDialogMutation",
    "selections": [
      (v3/*: any*/)
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "CreateTaskDialogMutation",
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": (v2/*: any*/),
        "filters": null,
        "handle": "prependNode",
        "key": "",
        "kind": "LinkedHandle",
        "name": "createTask",
        "handleArgs": [
          {
            "kind": "Variable",
            "name": "connections",
            "variableName": "connectionKeys"
          },
          {
            "kind": "Literal",
            "name": "edgeTypeName",
            "value": "TaskEdge"
          }
        ]
      }
    ]
  },
  "params": {
    "cacheID": "36a3afe65a63621e47ae2f8847212576",
    "id": null,
    "metadata": {},
    "name": "CreateTaskDialogMutation",
    "operationKind": "mutation",
    "text": "mutation CreateTaskDialogMutation(\n  $input: CreateTaskInput!\n) {\n  createTask(input: $input) {\n    id\n    title\n  }\n}\n"
  }
};
})();

(node as any).hash = "746bad8cecc20209c17656ed3192c08d";

export default node;
