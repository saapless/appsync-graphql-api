import type {
  TaskTable_data$data,
  TaskTable_data$key,
} from "@/__generated__/TaskTable_data.graphql";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TaskTableToolbar } from "./TaskTableToolbar";
import { columns } from "./TaskTableColumns";
import { graphql, useFragment } from "react-relay/hooks";
import { useMemo, useState } from "react";

const fragment = graphql`
  fragment TaskTable_data on Viewer {
    tasks(first: 100) @connection(key: "TaskTable_tasks") {
      edges {
        node {
          id
          title
          status {
            id
            title
            icon
          }
          priority {
            id
            title
            icon
          }
          labels {
            edges {
              node {
                id
                title
                color
              }
            }
          }
        }
      }
    }
  }
`;

export type TaskNode = Exclude<TaskTable_data$data["tasks"]["edges"][number]["node"], null>;

type TaskTableProps = {
  data: TaskTable_data$key;
};

export function TaskTable(props: TaskTableProps) {
  const { tasks } = useFragment(fragment, props.data);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(() => {
    return [...tasks.edges].map(({ node }) => node).filter(Boolean) as Exclude<
      TaskTable_data$data["tasks"]["edges"][number]["node"],
      null
    >[];
  }, [tasks]);

  const table = useReactTable({
    data: data,
    columns: columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="space-y-4">
      <TaskTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
