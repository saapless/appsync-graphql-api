import { PriorityPopoverQuery } from "@/__generated__/PriorityPopoverQuery.graphql";
import {
  LoadablePopover,
  LoadablePopoverContent,
  LoadablePopoverTrigger,
} from "@/components/loadable-popover";
import { PropsWithChildren } from "react";
import { graphql } from "react-relay/hooks";

const query = graphql`
  query PriorityPopoverQuery {
    viewer @required(action: THROW) {
      priorities {
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

function PriorityPopover(props: PropsWithChildren) {
  return <LoadablePopover query={query}>{props.children}</LoadablePopover>;
}

const PriorityPopoverContent = LoadablePopoverContent<PriorityPopoverQuery>;

export {
  PriorityPopover,
  LoadablePopoverTrigger as PriorityPopoverTrigger,
  PriorityPopoverContent,
};
