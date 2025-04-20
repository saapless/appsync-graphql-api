import type * as Schema from "../schema-types";
import type { GraphQLFieldResolver } from "graphql";
import { type EntityTable } from "dexie";
type DBRecord = Schema.Node & Record<string, unknown>;
export type ResolverContext = {
  db: EntityTable<DBRecord, "id">;
  uuid(): string;
};
export type ReturnType<T> = T | Promise<T>;
export type WorkspaceOwnerResolver = GraphQLFieldResolver<
  Schema.Workspace,
  ResolverContext,
  undefined,
  ReturnType<Schema.User>
>;
export type WorkspaceLabelsResolver = GraphQLFieldResolver<
  Schema.Workspace,
  ResolverContext,
  Schema.WorkspaceLabelsArgs,
  ReturnType<Schema.LabelConnection>
>;
export type WorkspacePrioritiesResolver = GraphQLFieldResolver<
  Schema.Workspace,
  ResolverContext,
  Schema.WorkspacePrioritiesArgs,
  ReturnType<Schema.PriorityConnection>
>;
export type WorkspaceStatusesResolver = GraphQLFieldResolver<
  Schema.Workspace,
  ResolverContext,
  Schema.WorkspaceStatusesArgs,
  ReturnType<Schema.StatusConnection>
>;
export type TaskStatusResolver = GraphQLFieldResolver<
  Schema.Task,
  ResolverContext,
  undefined,
  ReturnType<Schema.Status>
>;
export type TaskPriorityResolver = GraphQLFieldResolver<
  Schema.Task,
  ResolverContext,
  undefined,
  ReturnType<Schema.Priority>
>;
export type TaskLabelsResolver = GraphQLFieldResolver<
  Schema.Task,
  ResolverContext,
  Schema.TaskLabelsArgs,
  ReturnType<Schema.LabelConnection>
>;
export type ViewerUserResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  undefined,
  ReturnType<Schema.User>
>;
export type ViewerWorkspaceResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  undefined,
  ReturnType<Schema.Workspace>
>;
export type ViewerTasksResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  Schema.ViewerTasksArgs,
  ReturnType<Schema.TaskConnection>
>;
export type ViewerLabelsResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  Schema.ViewerLabelsArgs,
  ReturnType<Schema.LabelConnection>
>;
export type ViewerPrioritiesResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  Schema.ViewerPrioritiesArgs,
  ReturnType<Schema.PriorityConnection>
>;
export type ViewerStatusesResolver = GraphQLFieldResolver<
  Schema.Viewer,
  ResolverContext,
  Schema.ViewerStatusesArgs,
  ReturnType<Schema.StatusConnection>
>;
export type QueryViewerResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  undefined,
  ReturnType<Schema.Viewer>
>;
export type QueryNodeResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryNodeArgs,
  ReturnType<Schema.Node>
>;
export type QueryGetStatusResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryGetStatusArgs,
  ReturnType<Schema.Status>
>;
export type QueryListStatusesResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryListStatusesArgs,
  ReturnType<Schema.StatusConnection>
>;
export type QueryGetPriorityResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryGetPriorityArgs,
  ReturnType<Schema.Priority>
>;
export type QueryListPrioritiesResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryListPrioritiesArgs,
  ReturnType<Schema.PriorityConnection>
>;
export type QueryGetLabelResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryGetLabelArgs,
  ReturnType<Schema.Label>
>;
export type QueryListLabelsResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.QueryListLabelsArgs,
  ReturnType<Schema.LabelConnection>
>;
export type MutationUpdateUserResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdateUserArgs,
  ReturnType<Schema.User>
>;
export type MutationUpdateWorkspaceResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdateWorkspaceArgs,
  ReturnType<Schema.Workspace>
>;
export type MutationCreateTaskResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationCreateTaskArgs,
  ReturnType<Schema.Task>
>;
export type MutationUpdateTaskResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdateTaskArgs,
  ReturnType<Schema.Task>
>;
export type MutationDeleteTaskResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationDeleteTaskArgs,
  ReturnType<Schema.Task>
>;
export type MutationCreateLabelEdgeResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationCreateLabelEdgeArgs,
  ReturnType<Schema.LabelEdge>
>;
export type MutationDeleteLabelEdgeResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationDeleteLabelEdgeArgs,
  ReturnType<Schema.LabelEdge>
>;
export type MutationCreateStatusResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationCreateStatusArgs,
  ReturnType<Schema.Status>
>;
export type MutationUpdateStatusResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdateStatusArgs,
  ReturnType<Schema.Status>
>;
export type MutationDeleteStatusResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationDeleteStatusArgs,
  ReturnType<Schema.Status>
>;
export type MutationCreatePriorityResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationCreatePriorityArgs,
  ReturnType<Schema.Priority>
>;
export type MutationUpdatePriorityResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdatePriorityArgs,
  ReturnType<Schema.Priority>
>;
export type MutationDeletePriorityResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationDeletePriorityArgs,
  ReturnType<Schema.Priority>
>;
export type MutationCreateLabelResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationCreateLabelArgs,
  ReturnType<Schema.Label>
>;
export type MutationUpdateLabelResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationUpdateLabelArgs,
  ReturnType<Schema.Label>
>;
export type MutationDeleteLabelResolver = GraphQLFieldResolver<
  undefined,
  ResolverContext,
  Schema.MutationDeleteLabelArgs,
  ReturnType<Schema.Label>
>;
export type LabelConnectionEdgesResolver = GraphQLFieldResolver<
  Schema.LabelConnection,
  ResolverContext,
  undefined,
  ReturnType<Schema.LabelEdge[]>
>;
export type LabelEdgeNodeResolver = GraphQLFieldResolver<
  Schema.LabelEdge,
  ResolverContext,
  undefined,
  ReturnType<Schema.Label>
>;
