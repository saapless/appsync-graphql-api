export type Maybe<T> = T | null | undefined;
export type User = {
  firstName?: Maybe<string>;
  lastName?: Maybe<string>;
  email?: Maybe<string>;
  picture?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export type WorkspaceLabelsArgs = {
  filter?: Maybe<LabelFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type WorkspacePrioritiesArgs = {
  filter?: Maybe<PriorityFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type WorkspaceStatusesArgs = {
  filter?: Maybe<StatusFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type Workspace = {
  name?: Maybe<string>;
  userId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export type TaskLabelsArgs = {
  filter?: Maybe<LabelEdgeFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type Task = {
  title: string;
  statusId?: Maybe<string>;
  priorityId?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export interface TagProperty {
  title?: Maybe<string>;
}
export type Status = {
  title?: Maybe<string>;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export type Priority = {
  title?: Maybe<string>;
  value: number;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export type Label = {
  title?: Maybe<string>;
  color?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
};
export type ViewerTasksArgs = {
  filter?: Maybe<TaskFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type ViewerLabelsArgs = {
  filter?: Maybe<LabelFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type ViewerPrioritiesArgs = {
  filter?: Maybe<PriorityFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type ViewerStatusesArgs = {
  filter?: Maybe<StatusFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type Viewer = {
  id: string;
  userId?: Maybe<string>;
  workspaceId?: Maybe<string>;
};
export type QueryNodeArgs = {
  id: string;
};
export type QueryGetStatusArgs = {
  id: string;
};
export type QueryListStatusesArgs = {
  filter?: Maybe<StatusFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type QueryGetPriorityArgs = {
  id: string;
};
export type QueryListPrioritiesArgs = {
  filter?: Maybe<PriorityFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export type QueryGetLabelArgs = {
  id: string;
};
export type QueryListLabelsArgs = {
  filter?: Maybe<LabelFilterInput>;
  first?: Maybe<number>;
  after?: Maybe<string>;
  sort?: Maybe<SortDirection>;
};
export interface Node {
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
  __typename: string;
}
export type PageInfo = {
  hasNextPage?: Maybe<boolean>;
  hasPreviousPage?: Maybe<boolean>;
  startCursor?: Maybe<string>;
  endCursor?: Maybe<string>;
};
export type SizeFilterInput = {
  ne?: Maybe<number>;
  eq?: Maybe<number>;
  le?: Maybe<number>;
  lt?: Maybe<number>;
  ge?: Maybe<number>;
  gt?: Maybe<number>;
  between?: Maybe<number[]>;
};
export type StringFilterInput = {
  ne?: Maybe<string>;
  eq?: Maybe<string>;
  le?: Maybe<string>;
  lt?: Maybe<string>;
  ge?: Maybe<string>;
  gt?: Maybe<string>;
  in?: Maybe<string[]>;
  contains?: Maybe<string>;
  notContains?: Maybe<string>;
  between?: Maybe<string[]>;
  beginsWith?: Maybe<string>;
  attributeExists?: Maybe<boolean>;
  size?: Maybe<SizeFilterInput>;
};
export type IntFilterInput = {
  ne?: Maybe<number>;
  eq?: Maybe<number>;
  le?: Maybe<number>;
  lt?: Maybe<number>;
  ge?: Maybe<number>;
  gt?: Maybe<number>;
  in?: Maybe<number[]>;
  between?: Maybe<number[]>;
  attributeExists?: Maybe<boolean>;
};
export type FloatFilterInput = {
  ne?: Maybe<number>;
  eq?: Maybe<number>;
  le?: Maybe<number>;
  lt?: Maybe<number>;
  ge?: Maybe<number>;
  gt?: Maybe<number>;
  in?: Maybe<number[]>;
  between?: Maybe<number[]>;
  attributeExists?: Maybe<boolean>;
};
export type BooleanFilterInput = {
  ne?: Maybe<boolean>;
  eq?: Maybe<boolean>;
  attributeExists?: Maybe<boolean>;
};
export type IDFilterInput = {
  ne?: Maybe<string>;
  eq?: Maybe<string>;
  in?: Maybe<string[]>;
  attributeExists?: Maybe<boolean>;
};
export type ListFilterInput = {
  contains?: Maybe<string>;
  notContains?: Maybe<string>;
  size?: Maybe<SizeFilterInput>;
};
export type SortDirection = "ASC" | "DESC";
export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};
export type MutationUpdateWorkspaceArgs = {
  input: UpdateWorkspaceInput;
};
export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};
export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
};
export type MutationDeleteTaskArgs = {
  id: string;
};
export type MutationCreateLabelEdgeArgs = {
  input: LabelEdgeInput;
};
export type MutationDeleteLabelEdgeArgs = {
  input: LabelEdgeInput;
};
export type MutationCreateStatusArgs = {
  input: CreateStatusInput;
};
export type MutationUpdateStatusArgs = {
  input: UpdateStatusInput;
};
export type MutationDeleteStatusArgs = {
  id: string;
};
export type MutationCreatePriorityArgs = {
  input: CreatePriorityInput;
};
export type MutationUpdatePriorityArgs = {
  input: UpdatePriorityInput;
};
export type MutationDeletePriorityArgs = {
  id: string;
};
export type MutationCreateLabelArgs = {
  input: CreateLabelInput;
};
export type MutationUpdateLabelArgs = {
  input: UpdateLabelInput;
};
export type MutationDeleteLabelArgs = {
  id: string;
};
export type UpdateUserInput = {
  firstName?: Maybe<string>;
  lastName?: Maybe<string>;
  picture?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type UpdateWorkspaceInput = {
  name?: Maybe<string>;
  userId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type LabelConnection = {
  edges: LabelEdge[];
  pageInfo: PageInfo;
  keys?: Maybe<Node[]>;
};
export type LabelEdge = {
  cursor?: Maybe<string>;
  node?: Maybe<Label>;
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  updatedAt: string;
  __typename: string;
};
export type LabelFilterInput = {
  title?: Maybe<StringFilterInput>;
  color?: Maybe<StringFilterInput>;
  and?: Maybe<LabelFilterInput[]>;
  or?: Maybe<LabelFilterInput[]>;
  not?: Maybe<LabelFilterInput>;
};
export type PriorityConnection = {
  edges: PriorityEdge[];
  pageInfo: PageInfo;
};
export type PriorityEdge = {
  cursor?: Maybe<string>;
  node?: Maybe<Priority>;
};
export type PriorityFilterInput = {
  title?: Maybe<StringFilterInput>;
  value?: Maybe<IntFilterInput>;
  icon?: Maybe<StringFilterInput>;
  and?: Maybe<PriorityFilterInput[]>;
  or?: Maybe<PriorityFilterInput[]>;
  not?: Maybe<PriorityFilterInput>;
};
export type StatusConnection = {
  edges: StatusEdge[];
  pageInfo: PageInfo;
};
export type StatusEdge = {
  cursor?: Maybe<string>;
  node?: Maybe<Status>;
};
export type StatusFilterInput = {
  title?: Maybe<StringFilterInput>;
  icon?: Maybe<StringFilterInput>;
  and?: Maybe<StatusFilterInput[]>;
  or?: Maybe<StatusFilterInput[]>;
  not?: Maybe<StatusFilterInput>;
};
export type CreateTaskInput = {
  title?: Maybe<string>;
  statusId?: Maybe<string>;
  priorityId?: Maybe<string>;
  sourceId?: Maybe<string>;
  id?: Maybe<string>;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type UpdateTaskInput = {
  title?: Maybe<string>;
  statusId?: Maybe<string>;
  priorityId?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type LabelEdgeFilterInput = {
  createdAt?: Maybe<StringFilterInput>;
  updatedAt?: Maybe<StringFilterInput>;
  and?: Maybe<LabelEdgeFilterInput[]>;
  or?: Maybe<LabelEdgeFilterInput[]>;
  not?: Maybe<LabelEdgeFilterInput>;
};
export type LabelEdgeInput = {
  sourceId: string;
  targetId: string;
};
export type CreateStatusInput = {
  title?: Maybe<string>;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id?: Maybe<string>;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type UpdateStatusInput = {
  title?: Maybe<string>;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type CreatePriorityInput = {
  title?: Maybe<string>;
  value?: Maybe<number>;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id?: Maybe<string>;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type UpdatePriorityInput = {
  title?: Maybe<string>;
  value?: Maybe<number>;
  icon?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type CreateLabelInput = {
  title?: Maybe<string>;
  color?: Maybe<string>;
  sourceId?: Maybe<string>;
  id?: Maybe<string>;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type UpdateLabelInput = {
  title?: Maybe<string>;
  color?: Maybe<string>;
  sourceId?: Maybe<string>;
  id: string;
  createdAt?: Maybe<string>;
  updatedAt?: Maybe<string>;
};
export type TaskConnection = {
  edges: TaskEdge[];
  pageInfo: PageInfo;
};
export type TaskEdge = {
  cursor?: Maybe<string>;
  node?: Maybe<Task>;
};
export type TaskFilterInput = {
  title?: Maybe<StringFilterInput>;
  id?: Maybe<IDFilterInput>;
  createdAt?: Maybe<StringFilterInput>;
  updatedAt?: Maybe<StringFilterInput>;
  and?: Maybe<TaskFilterInput[]>;
  or?: Maybe<TaskFilterInput[]>;
  not?: Maybe<TaskFilterInput>;
};
