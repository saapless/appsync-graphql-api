/**
 * @generated SignedSource<<324699d56460906bfea1910e56ef7108>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type StatusFilterCommandItem_data$data = {
  readonly icon: string | null;
  readonly id: string;
  readonly title: string;
  readonly " $fragmentType": "StatusFilterCommandItem_data";
};
export type StatusFilterCommandItem_data$key = {
  readonly " $data"?: StatusFilterCommandItem_data$data;
  readonly " $fragmentSpreads": FragmentRefs<"StatusFilterCommandItem_data">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "StatusFilterCommandItem_data",
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
  "type": "Status",
  "abstractKey": null
};

(node as any).hash = "b76d93a61f28a9004c6c6002fea5cde6";

export default node;
