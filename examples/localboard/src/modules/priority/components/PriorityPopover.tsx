import {
  PriorityPopoverQuery,
  PriorityPopoverQuery$data,
} from "@/__generated__/PriorityPopoverQuery.graphql";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import {
  ComponentProps,
  createContext,
  ReactNode,
  useContext,
  type FC,
  type PropsWithChildren,
} from "react";
import { graphql, PreloadedQuery, usePreloadedQuery, useQueryLoader } from "react-relay/hooks";

const query = graphql`
  query PriorityPopoverQuery {
    listPriorities {
      edges {
        node {
          id
          title
          icon
          value
        }
      }
    }
  }
`;

type PriorityPopoverContextValue = {
  queryReference: PreloadedQuery<PriorityPopoverQuery> | null;
};

const PriorityPopoverContext = createContext<PriorityPopoverContextValue>({ queryReference: null });

type PriorityPopoverProps = PropsWithChildren<Record<string, unknown>>;

const PriorityPopover: FC<PriorityPopoverProps> = (props) => {
  const [queryReference, loadQuery, disposeQuery] = useQueryLoader<PriorityPopoverQuery>(query);
  const { children } = props;

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) return loadQuery({});
    return disposeQuery();
  };

  return (
    <PriorityPopoverContext value={{ queryReference: queryReference ?? null }}>
      <Popover open={Boolean(queryReference)} onOpenChange={onOpenChange}>
        {children}
      </Popover>
    </PriorityPopoverContext>
  );
};

const PriorityPopoverTrigger: FC<ComponentProps<typeof PopoverTrigger>> = (props) => {
  return <PopoverTrigger {...props} />;
};

const PriorityPopoverContentLoader: FC<ComponentProps<typeof PriorityPopoverContent>> = (props) => {
  const { queryReference } = useContext(PriorityPopoverContext);
  return queryReference ? <PriorityPopoverContent {...props} /> : null;
};

type PriorityPopoverContentProps = ComponentProps<typeof PopoverContent> & {
  queryReference: PreloadedQuery<PriorityPopoverQuery>;
  children: (data: PriorityPopoverQuery$data) => ReactNode;
};

const PriorityPopoverContent: FC<PriorityPopoverContentProps> = (props) => {
  const { queryReference, children, ...rest } = props;
  const data = usePreloadedQuery(query, queryReference);

  return <PopoverContent {...rest}>{children(data)}</PopoverContent>;
};

export {
  PriorityPopover,
  PriorityPopoverContentLoader as PriorityPopoverContent,
  PriorityPopoverTrigger,
};
