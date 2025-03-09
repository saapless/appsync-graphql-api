/**
 * @generated SignedSource<<9c3626060ed28debc9b6d03ad02ac4a0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PriorityFilterCommandItem_data$data = {
  readonly icon: string | null;
  readonly id: string;
  readonly title: string;
  readonly " $fragmentType": "PriorityFilterCommandItem_data";
};
export type PriorityFilterCommandItem_data$key = {
  readonly " $data"?: PriorityFilterCommandItem_data$data;
  readonly " $fragmentSpreads": FragmentRefs<"PriorityFilterCommandItem_data">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "PriorityFilterCommandItem_data",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "kind": "RequiredField",
      "field": {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "title",
        "storageKey": null
      },
      "action": "THROW"
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "icon",
      "storageKey": null
    }
  ],
  "type": "Priority",
  "abstractKey": null
};

(node as any).hash = "84495da95261925c9f021e1d75e77ea0";

export default node;
