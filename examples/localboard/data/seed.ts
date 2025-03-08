import {
  Label,
  LabelEdge,
  Priority,
  Status,
  Task,
  User,
  Viewer,
  Workspace,
} from "../__generated__/schema-types";
import { IconName } from "lucide-react/dynamic";

type StatusSeed = {
  title: string;
  icon: IconName;
};

const STATUSES: StatusSeed[] = [
  { title: "Backlog", icon: "help-circle" },
  { title: "Todo", icon: "circle" },
  { title: "In Progress", icon: "timer" },
  { title: "Done", icon: "check-circle" },
  { title: "Cancelled", icon: "circle-off" },
];

type PrioritySeed = {
  title: string;
  icon: IconName;
  value: number;
};

const PRIORITIES: PrioritySeed[] = [
  { title: "Urgent", icon: "clock-arrow-up", value: 1 },
  { title: "High", icon: "arrow-up", value: 2 },
  { title: "Medium", icon: "arrow-right", value: 3 },
  { title: "Low", icon: "arrow-down", value: 4 },
];

type LabelSeed = {
  title: string;
  color: string;
};

const LABELS: LabelSeed[] = [
  { title: "Bug", color: "red" },
  { title: "Feat", color: "green" },
  { title: "Perf", color: "blue" },
  { title: "Docs", color: "purple" },
  { title: "API", color: "orange" },
  { title: "App", color: "yellow" },
  { title: "CI/CD", color: "slate" },
  { title: "UI/UX", color: "magenta" },
];

const TASKS = [
  "Refactor database schema to support recurring tasks",
  "Fix task deletion bug causing orphaned subtasks",
  "Improve performance of task filtering by status",
  "Implement drag-and-drop task reordering",
  "Add due date reminders via email and push notifications",
  "Optimize GraphQL queries to reduce overfetching",
  "Fix UI glitch when editing tasks in dark mode",
  "Enhance search functionality with fuzzy matching",
  "Implement offline mode for task creation and updates",
  "Add activity log to track task changes",
  "Improve accessibility compliance (WCAG 2.1)",
  "Resolve race condition when updating task status",
  "Implement role-based permissions for project members",
  "Fix inconsistent date formatting across timezones",
  "Add undo/redo functionality for task edits",
  "Improve error messages for GraphQL mutation failures",
  "Optimize initial data load to improve app startup time",
  "Fix missing notifications for assigned tasks",
  "Refactor frontend state management to reduce re-renders",
  "Add support for task dependencies and blockers",
];

export function getRecords() {
  const records: Record<string, unknown>[] = [];
  const timestamp = new Date().toISOString();

  const user = {
    id: crypto.randomUUID(),
    firstName: "Finn",
    lastName: "Sparklewood",
    email: "finn.sparky87@saapless.com",
    createdAt: timestamp,
    updatedAt: timestamp,
    __typename: "User",
  } satisfies User;

  const workspace = {
    id: crypto.randomUUID(),
    name: "SparkleTech HQ",
    userId: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    __typename: "Workspace",
  } satisfies Workspace;

  const viewer = {
    id: "root:viewer:id",
    userId: user.id,
    workspaceId: workspace.id,
  } satisfies Viewer;

  records.push(user, workspace, viewer);

  const statuses = STATUSES.map(
    (status) =>
      ({
        id: crypto.randomUUID(),
        title: status.title,
        icon: status.icon,
        sourceId: workspace.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: "Status",
      }) satisfies Status
  );

  const priorities = PRIORITIES.map(
    (priority) =>
      ({
        id: crypto.randomUUID(),
        title: priority.title,
        icon: priority.icon,
        value: priority.value,
        sourceId: workspace.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: "Priority",
      }) satisfies Priority
  );

  const labels = LABELS.map(
    (label) =>
      ({
        id: crypto.randomUUID(),
        title: label.title,
        color: label.color,
        sourceId: workspace.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: "Label",
      }) satisfies Label
  );

  records.push(...statuses, ...priorities, ...labels);

  for (const task of TASKS) {
    const taskRecord = {
      id: crypto.randomUUID(),
      title: task,
      statusId: statuses[Math.floor(Math.random() * statuses.length)].id,
      priorityId: priorities[Math.floor(Math.random() * priorities.length)].id,
      sourceId: workspace.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      __typename: "Task",
    } satisfies Task;

    const labelIds: string[] = Array(Math.floor(Math.random() * 4))
      .fill("")
      .reduce((agg) => {
        const label = labels[Math.floor(Math.random() * labels.length)];
        if (!agg.includes(label.id)) {
          agg.push(label.id);
        }
        return agg;
      }, [] as string[]);

    const lablesEdges = labelIds.map(
      (targetId) =>
        ({
          id: `${taskRecord.id}#${targetId}`,
          sourceId: taskRecord.id,
          targetId: targetId,
          createdAt: timestamp,
          updatedAt: timestamp,
          __typename: "LabelEdge",
        }) satisfies LabelEdge
    );

    records.push(taskRecord, ...lablesEdges);
  }

  return records;
}
