import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTableViewOptions } from "./TaskTableViewOptions";
import { TaskTableFacetedFilter } from "./TaskTableFacetedFilter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function TaskTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <TaskTableFacetedFilter column={table.getColumn("status")} title="Status" options={[]} />
        )}
        {table.getColumn("priority") && (
          <TaskTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={[]}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <TaskTableViewOptions table={table} />
    </div>
  );
}
