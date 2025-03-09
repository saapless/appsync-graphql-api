import type { PriorityFilterQuery } from "@/__generated__/PriorityFilterQuery.graphql";
import {
  LoadablePopover,
  LoadablePopoverContent,
  LoadablePopoverTrigger,
} from "@/components/loadable-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Column } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { graphql } from "react-relay/hooks";
import { PriorityFilterCommandItem } from "./PriorityFilterCommandItem";
import { FacetedFilterCommand } from "./FacetedFilterCommand";

const query = graphql`
  query PriorityFilterQuery {
    viewer @required(action: THROW) {
      priorities {
        edges {
          node {
            id
            ...PriorityFilterCommandItem_data
          }
        }
      }
    }
  }
`;

type PriorityFilterProps<TData> = {
  column: Column<TData>;
};

function PriorityFilter<TData>({ column }: PriorityFilterProps<TData>) {
  const facets = column.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  const onSelectItem = (value: string) => {
    if (selectedValues.has(value)) {
      selectedValues.delete(value);
    } else {
      selectedValues.add(value);
    }
    const filterValues = Array.from(selectedValues);
    column.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  return (
    <LoadablePopover query={query}>
      <LoadablePopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          Priority
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedValues.size} selected
                </Badge>
              </div>
            </>
          )}
        </Button>
      </LoadablePopoverTrigger>
      <LoadablePopoverContent<PriorityFilterQuery> className="w-[200px] p-0" align="start">
        {({ viewer }) => {
          return (
            <FacetedFilterCommand
              onClear={() => column?.setFilterValue(undefined)}
              hasFilters={selectedValues.size > 0}
            >
              {viewer.priorities.edges.map(({ node }) =>
                node ? (
                  <PriorityFilterCommandItem
                    key={node.id}
                    isSelected={selectedValues.has(node.id)}
                    data={node}
                    facets={facets}
                    onSelect={onSelectItem}
                  />
                ) : null
              )}
            </FacetedFilterCommand>
          );
        }}
      </LoadablePopoverContent>
    </LoadablePopover>
  );
}

export { PriorityFilter };
