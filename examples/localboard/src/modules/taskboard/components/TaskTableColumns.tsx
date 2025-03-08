import { ColumnDef } from "@tanstack/react-table";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { TaskTableColumnHeader } from "./TaskTableColumnHeader";
import { TaskTableRowActions } from "./TaskTableRowActions";
import { TaskNode } from "./TaskTable";

export const columns: ColumnDef<TaskNode>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <TaskTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => {
      const labels = row.original.labels.edges
        .filter(({ node }) => Boolean(node))
        .map(({ node }) => <Badge variant="outline">{node?.title}</Badge>);

      return (
        <div className="flex space-x-2">
          {labels}
          <span className="max-w-[500px] truncate font-medium">{row.getValue("title")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <TaskTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <DynamicIcon
              name={status.icon as IconName}
              className="mr-2 h-4 w-4 text-muted-foreground"
            />
          )}
          <span>{status.title}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <TaskTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priority = row.original.priority;

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center">
          {priority.icon && (
            <DynamicIcon
              name={priority.icon as IconName}
              className="mr-2 h-4 w-4 text-muted-foreground"
            />
          )}
          <span>{priority.title}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <TaskTableRowActions row={row} />,
  },
];
