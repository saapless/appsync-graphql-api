import type {
  StatusPopoverQuery,
  StatusPopoverQuery$data,
} from "@/__generated__/StatusPopoverQuery.graphql";
import {
  LoadablePopover,
  LoadablePopoverContent,
  LoadablePopoverTrigger,
} from "@/components/loadable-popover";
import { PropsWithChildren } from "react";
import { graphql } from "react-relay/hooks";

const query = graphql`
  query StatusPopoverQuery {
    viewer @required(action: THROW) {
      statuses {
        edges {
          node {
            id
            title
            icon
          }
        }
      }
    }
  }
`;

export type StatusNode = StatusPopoverQuery$data["viewer"]["statuses"]["edges"][number]["node"];

function StatusPopover(props: PropsWithChildren) {
  return <LoadablePopover query={query}>{props.children}</LoadablePopover>;
}

const StatusPopoverContent = LoadablePopoverContent<StatusPopoverQuery>;

export { StatusPopover, StatusPopoverContent, LoadablePopoverTrigger as StatusPopoverTrigger };
