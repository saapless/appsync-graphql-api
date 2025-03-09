/**
 * @generated SignedSource<<343ad70a6080dd066c1ff831ecfe788d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TaskBoard_data$data = {
  readonly __id: string;
  readonly user: {
    readonly firstName: string | null;
    readonly id: string;
  };
  readonly " $fragmentSpreads": FragmentRefs<"TaskTable_data">;
  readonly " $fragmentType": "TaskBoard_data";
};
export type TaskBoard_data$key = {
  readonly " $data"?: TaskBoard_data$data;
  readonly " $fragmentSpreads": FragmentRefs<"TaskBoard_data">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TaskBoard_data",
  "selections": [
    {
      "kind": "RequiredField",
      "field": {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "user",
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
            "name": "firstName",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      "action": "THROW"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "TaskTable_data"
    },
    {
      "kind": "ClientExtension",
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "__id",
          "storageKey": null
        }
      ]
    }
  ],
  "type": "Viewer",
  "abstractKey": null
};

(node as any).hash = "e8d25b7abc793b24a0205226c3c69a80";

export default node;
