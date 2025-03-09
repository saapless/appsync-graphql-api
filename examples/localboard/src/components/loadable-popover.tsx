import type { GraphQLTaggedNode, OperationType } from "relay-runtime";
import { ComponentProps, createContext, ReactNode, Suspense, useContext } from "react";
import { PreloadedQuery, usePreloadedQuery, useQueryLoader } from "react-relay/hooks";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type LoadablePopoverContextValue<TQuery extends OperationType = OperationType> = {
  queryReference: PreloadedQuery<TQuery> | null;
  taggedNode: GraphQLTaggedNode | null;
};

const LoadablePopoverContext = createContext<LoadablePopoverContextValue>({
  queryReference: null,
  taggedNode: null,
});

type LoadablePopoverProps<TQuery extends OperationType> = ComponentProps<typeof Popover> & {
  query: GraphQLTaggedNode;
  variables?: TQuery["variables"];
};

function LoadablePopover<TQuery extends OperationType>(props: LoadablePopoverProps<TQuery>) {
  const { query, variables = {}, ...rest } = props;
  const [queryReference, loadQuery, disposeQuery] = useQueryLoader<TQuery>(query);

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) return loadQuery(variables);
    return disposeQuery();
  };

  return (
    <LoadablePopoverContext value={{ queryReference: queryReference ?? null, taggedNode: query }}>
      <Popover open={Boolean(queryReference)} onOpenChange={onOpenChange} {...rest} />
    </LoadablePopoverContext>
  );
}

function LoadablePopoverTrigger(props: ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger {...props} />;
}

function LoadablePopoverContentLoader<TQuery extends OperationType>(
  props: Omit<
    ComponentProps<typeof LoadablePopoverContent<TQuery>>,
    "queryReference" | "taggedNode"
  >
) {
  const { queryReference, taggedNode } = useContext(LoadablePopoverContext);
  return queryReference && taggedNode ? (
    <Suspense>
      <LoadablePopoverContent<TQuery>
        {...props}
        queryReference={queryReference as PreloadedQuery<TQuery>}
        taggedNode={taggedNode}
      />
    </Suspense>
  ) : null;
}

type LoadablePopoverContentProps<TQuery extends OperationType> = Omit<
  ComponentProps<typeof PopoverContent>,
  "children"
> & {
  queryReference: PreloadedQuery<TQuery>;
  taggedNode: GraphQLTaggedNode;
  children: ReactNode | ((data: TQuery["response"]) => ReactNode);
};

function LoadablePopoverContent<TQuery extends OperationType>(
  props: LoadablePopoverContentProps<TQuery>
) {
  const { queryReference, taggedNode, children, ...rest } = props;
  const data = usePreloadedQuery<TQuery>(taggedNode, queryReference);

  return (
    <PopoverContent {...rest}>
      {typeof children === "function" ? children(data) : children}
    </PopoverContent>
  );
}

export {
  LoadablePopover,
  LoadablePopoverContentLoader as LoadablePopoverContent,
  LoadablePopoverTrigger,
};
