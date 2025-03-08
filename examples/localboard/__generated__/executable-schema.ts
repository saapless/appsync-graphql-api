import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLSchema,
} from "graphql";
import {
  filterExpression,
  formatConnection,
  formatEdges,
} from "@saapless/graphql-utils";
let User: GraphQLObjectType;
let Workspace: GraphQLObjectType;
let Task: GraphQLObjectType;
let TagProperty: GraphQLInterfaceType;
let Status: GraphQLObjectType;
let Priority: GraphQLObjectType;
let Label: GraphQLObjectType;
let Viewer: GraphQLObjectType;
let Query: GraphQLObjectType;
let Node: GraphQLInterfaceType;
let PageInfo: GraphQLObjectType;
let SizeFilterInput: GraphQLInputObjectType;
let StringFilterInput: GraphQLInputObjectType;
let IntFilterInput: GraphQLInputObjectType;
let FloatFilterInput: GraphQLInputObjectType;
let BooleanFilterInput: GraphQLInputObjectType;
let IDFilterInput: GraphQLInputObjectType;
let ListFilterInput: GraphQLInputObjectType;
let Mutation: GraphQLObjectType;
let UpdateUserInput: GraphQLInputObjectType;
let UpdateWorkspaceInput: GraphQLInputObjectType;
let LabelConnection: GraphQLObjectType;
let LabelEdge: GraphQLObjectType;
let LabelFilterInput: GraphQLInputObjectType;
let PriorityConnection: GraphQLObjectType;
let PriorityEdge: GraphQLObjectType;
let PriorityFilterInput: GraphQLInputObjectType;
let StatusConnection: GraphQLObjectType;
let StatusEdge: GraphQLObjectType;
let StatusFilterInput: GraphQLInputObjectType;
let CreateTaskInput: GraphQLInputObjectType;
let UpdateTaskInput: GraphQLInputObjectType;
let LabelEdgeFilterInput: GraphQLInputObjectType;
let LabelEdgeInput: GraphQLInputObjectType;
let CreateStatusInput: GraphQLInputObjectType;
let UpdateStatusInput: GraphQLInputObjectType;
let CreatePriorityInput: GraphQLInputObjectType;
let UpdatePriorityInput: GraphQLInputObjectType;
let CreateLabelInput: GraphQLInputObjectType;
let UpdateLabelInput: GraphQLInputObjectType;
let TaskConnection: GraphQLObjectType;
let TaskEdge: GraphQLObjectType;
let TaskFilterInput: GraphQLInputObjectType;
Node = new GraphQLInterfaceType({
  name: "Node",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
User = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    picture: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [Node],
});
TagProperty = new GraphQLInterfaceType({
  name: "TagProperty",
  fields: () => ({ title: { type: GraphQLString } }),
});
Label = new GraphQLObjectType({
  name: "Label",
  fields: () => ({
    title: { type: GraphQLString },
    color: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [TagProperty, Node],
});
LabelEdge = new GraphQLObjectType({
  name: "LabelEdge",
  fields: () => ({
    cursor: { type: GraphQLString },
    node: {
      type: Label,
      resolve: async (source, _, ctx) => {
        if (source?.node) {
          return source.node;
        }
        const result = await ctx.db.get(source.targetId);
        return result;
      },
    },
  }),
});
PageInfo = new GraphQLObjectType({
  name: "PageInfo",
  fields: () => ({
    hasNextPage: { type: GraphQLBoolean },
    hasPreviousPage: { type: GraphQLBoolean },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
  }),
});
LabelConnection = new GraphQLObjectType({
  name: "LabelConnection",
  fields: () => ({
    edges: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(LabelEdge))),
      resolve: async (source, _, ctx) => {
        if (source?.edges && source.edges.length) {
          return source.edges;
        }
        const result = await ctx.db.bulkGet(source.keys);
        return formatEdges(result);
      },
    },
    pageInfo: { type: new GraphQLNonNull(PageInfo) },
  }),
});
SizeFilterInput = new GraphQLInputObjectType({
  name: "SizeFilterInput",
  fields: () => ({
    ne: { type: GraphQLInt },
    eq: { type: GraphQLInt },
    le: { type: GraphQLInt },
    lt: { type: GraphQLInt },
    ge: { type: GraphQLInt },
    gt: { type: GraphQLInt },
    between: { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)) },
  }),
});
StringFilterInput = new GraphQLInputObjectType({
  name: "StringFilterInput",
  fields: () => ({
    ne: { type: GraphQLString },
    eq: { type: GraphQLString },
    le: { type: GraphQLString },
    lt: { type: GraphQLString },
    ge: { type: GraphQLString },
    gt: { type: GraphQLString },
    in: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    contains: { type: GraphQLString },
    notContains: { type: GraphQLString },
    between: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    beginsWith: { type: GraphQLString },
    attributeExists: { type: GraphQLBoolean },
    size: { type: SizeFilterInput },
  }),
});
LabelFilterInput = new GraphQLInputObjectType({
  name: "LabelFilterInput",
  fields: () => ({
    title: { type: StringFilterInput },
    color: { type: StringFilterInput },
    and: { type: new GraphQLList(LabelFilterInput) },
    or: { type: new GraphQLList(LabelFilterInput) },
    not: { type: LabelFilterInput },
  }),
});
const SortDirection = new GraphQLEnumType({
  name: "SortDirection",
  values: { ASC: { value: "ASC" }, DESC: { value: "DESC" } },
});
Priority = new GraphQLObjectType({
  name: "Priority",
  fields: () => ({
    title: { type: GraphQLString },
    value: { type: new GraphQLNonNull(GraphQLInt) },
    icon: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [TagProperty, Node],
});
PriorityEdge = new GraphQLObjectType({
  name: "PriorityEdge",
  fields: () => ({ cursor: { type: GraphQLString }, node: { type: Priority } }),
});
PriorityConnection = new GraphQLObjectType({
  name: "PriorityConnection",
  fields: () => ({
    edges: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(PriorityEdge)),
      ),
    },
    pageInfo: { type: new GraphQLNonNull(PageInfo) },
  }),
});
IntFilterInput = new GraphQLInputObjectType({
  name: "IntFilterInput",
  fields: () => ({
    ne: { type: GraphQLInt },
    eq: { type: GraphQLInt },
    le: { type: GraphQLInt },
    lt: { type: GraphQLInt },
    ge: { type: GraphQLInt },
    gt: { type: GraphQLInt },
    in: { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)) },
    between: { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)) },
    attributeExists: { type: GraphQLBoolean },
  }),
});
PriorityFilterInput = new GraphQLInputObjectType({
  name: "PriorityFilterInput",
  fields: () => ({
    title: { type: StringFilterInput },
    value: { type: IntFilterInput },
    icon: { type: StringFilterInput },
    and: { type: new GraphQLList(PriorityFilterInput) },
    or: { type: new GraphQLList(PriorityFilterInput) },
    not: { type: PriorityFilterInput },
  }),
});
Status = new GraphQLObjectType({
  name: "Status",
  fields: () => ({
    title: { type: GraphQLString },
    icon: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [TagProperty, Node],
});
StatusEdge = new GraphQLObjectType({
  name: "StatusEdge",
  fields: () => ({ cursor: { type: GraphQLString }, node: { type: Status } }),
});
StatusConnection = new GraphQLObjectType({
  name: "StatusConnection",
  fields: () => ({
    edges: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(StatusEdge))),
    },
    pageInfo: { type: new GraphQLNonNull(PageInfo) },
  }),
});
StatusFilterInput = new GraphQLInputObjectType({
  name: "StatusFilterInput",
  fields: () => ({
    title: { type: StringFilterInput },
    icon: { type: StringFilterInput },
    and: { type: new GraphQLList(StatusFilterInput) },
    or: { type: new GraphQLList(StatusFilterInput) },
    not: { type: StatusFilterInput },
  }),
});
Workspace = new GraphQLObjectType({
  name: "Workspace",
  fields: () => ({
    name: { type: GraphQLString },
    owner: {
      type: User,
      resolve: async (source, _, ctx) => {
        const result = await ctx.db.get(source.userId);
        return result;
      },
    },
    labels: {
      type: new GraphQLNonNull(LabelConnection),
      args: {
        filter: { type: LabelFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.id)
          .and(
            filterExpression({
              __typename: {
                beginsWith: "Label",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    priorities: {
      type: new GraphQLNonNull(PriorityConnection),
      args: {
        filter: { type: PriorityFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.id)
          .and(
            filterExpression({
              __typename: {
                beginsWith: "Priority",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    statuses: {
      type: new GraphQLNonNull(StatusConnection),
      args: {
        filter: { type: StatusFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.id)
          .and(
            filterExpression({
              __typename: {
                beginsWith: "Status",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [Node],
});
LabelEdgeFilterInput = new GraphQLInputObjectType({
  name: "LabelEdgeFilterInput",
  fields: () => ({
    createdAt: { type: StringFilterInput },
    updatedAt: { type: StringFilterInput },
    and: { type: new GraphQLList(LabelEdgeFilterInput) },
    or: { type: new GraphQLList(LabelEdgeFilterInput) },
    not: { type: LabelEdgeFilterInput },
  }),
});
Task = new GraphQLObjectType({
  name: "Task",
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    status: {
      type: Status,
      resolve: async (source, _, ctx) => {
        const result = await ctx.db.get(source.statusId);
        return result;
      },
    },
    priority: {
      type: Priority,
      resolve: async (source, _, ctx) => {
        const result = await ctx.db.get(source.priorityId);
        return result;
      },
    },
    labels: {
      type: new GraphQLNonNull(LabelConnection),
      args: {
        filter: { type: LabelEdgeFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.id)
          .and(
            filterExpression({
              __typename: {
                beginsWith: "LabelEdge",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({
          items: [],
          keys: result.map(({ targetId }) => targetId).filter(Boolean),
        });
      },
    },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
  interfaces: () => [Node],
});
TaskEdge = new GraphQLObjectType({
  name: "TaskEdge",
  fields: () => ({ cursor: { type: GraphQLString }, node: { type: Task } }),
});
TaskConnection = new GraphQLObjectType({
  name: "TaskConnection",
  fields: () => ({
    edges: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskEdge))),
    },
    pageInfo: { type: new GraphQLNonNull(PageInfo) },
  }),
});
IDFilterInput = new GraphQLInputObjectType({
  name: "IDFilterInput",
  fields: () => ({
    ne: { type: GraphQLID },
    eq: { type: GraphQLID },
    in: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
    attributeExists: { type: GraphQLBoolean },
  }),
});
TaskFilterInput = new GraphQLInputObjectType({
  name: "TaskFilterInput",
  fields: () => ({
    title: { type: StringFilterInput },
    id: { type: IDFilterInput },
    createdAt: { type: StringFilterInput },
    updatedAt: { type: StringFilterInput },
    and: { type: new GraphQLList(TaskFilterInput) },
    or: { type: new GraphQLList(TaskFilterInput) },
    not: { type: TaskFilterInput },
  }),
});
Viewer = new GraphQLObjectType({
  name: "Viewer",
  fields: () => ({
    user: {
      type: User,
      resolve: async (source, _, ctx) => {
        const result = await ctx.db.get(source.userId);
        return result;
      },
    },
    workspace: {
      type: Workspace,
      resolve: async (source, _, ctx) => {
        const result = await ctx.db.get(source.workspaceId);
        return result;
      },
    },
    tasks: {
      type: new GraphQLNonNull(TaskConnection),
      args: {
        filter: { type: TaskFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db.where("__typename").equals("Task");
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    labels: {
      type: new GraphQLNonNull(LabelConnection),
      args: {
        filter: { type: LabelFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.workspaceId)
          .and(
            filterExpression({
              __typename: {
                eq: "Label",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    priorities: {
      type: new GraphQLNonNull(PriorityConnection),
      args: {
        filter: { type: PriorityFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.workspaceId)
          .and(
            filterExpression({
              __typename: {
                eq: "Priority",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    statuses: {
      type: new GraphQLNonNull(StatusConnection),
      args: {
        filter: { type: StatusFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (source, args, ctx) => {
        let query = ctx.db
          .where("sourceId")
          .equals(source.workspaceId)
          .and(
            filterExpression({
              __typename: {
                eq: "Status",
              },
            }),
          );
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
  }),
});
Query = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    viewer: {
      type: Viewer,
      resolve: async (_, __, ctx) => {
        const result = await ctx.db.get("root:viewer:id");
        return result;
      },
    },
    node: {
      type: Node,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const result = await ctx.db.get(args.id);
        return result;
      },
    },
    getStatus: {
      type: Status,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const result = await ctx.db.get(args.id);
        return result;
      },
    },
    listStatuses: {
      type: new GraphQLNonNull(StatusConnection),
      args: {
        filter: { type: StatusFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (_, args, ctx) => {
        let query = ctx.db.where("__typename").equals("Status");
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    getPriority: {
      type: Priority,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const result = await ctx.db.get(args.id);
        return result;
      },
    },
    listPriorities: {
      type: new GraphQLNonNull(PriorityConnection),
      args: {
        filter: { type: PriorityFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (_, args, ctx) => {
        let query = ctx.db.where("__typename").equals("Priority");
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
    getLabel: {
      type: Label,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const result = await ctx.db.get(args.id);
        return result;
      },
    },
    listLabels: {
      type: new GraphQLNonNull(LabelConnection),
      args: {
        filter: { type: LabelFilterInput },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        sort: { type: SortDirection },
      },
      resolve: async (_, args, ctx) => {
        let query = ctx.db.where("__typename").equals("Label");
        if (args.filter) {
          query = query.filter(filterExpression(args.filter));
        }
        if (args.sort === "DESC") {
          query = query.reverse();
        }
        const result = await query.toArray();
        return formatConnection({ items: result });
      },
    },
  }),
});
FloatFilterInput = new GraphQLInputObjectType({
  name: "FloatFilterInput",
  fields: () => ({
    ne: { type: GraphQLFloat },
    eq: { type: GraphQLFloat },
    le: { type: GraphQLFloat },
    lt: { type: GraphQLFloat },
    ge: { type: GraphQLFloat },
    gt: { type: GraphQLFloat },
    in: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
    between: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
    attributeExists: { type: GraphQLBoolean },
  }),
});
BooleanFilterInput = new GraphQLInputObjectType({
  name: "BooleanFilterInput",
  fields: () => ({
    ne: { type: GraphQLBoolean },
    eq: { type: GraphQLBoolean },
    attributeExists: { type: GraphQLBoolean },
  }),
});
ListFilterInput = new GraphQLInputObjectType({
  name: "ListFilterInput",
  fields: () => ({
    contains: { type: GraphQLString },
    notContains: { type: GraphQLString },
    size: { type: SizeFilterInput },
  }),
});
UpdateUserInput = new GraphQLInputObjectType({
  name: "UpdateUserInput",
  fields: () => ({
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    picture: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
UpdateWorkspaceInput = new GraphQLInputObjectType({
  name: "UpdateWorkspaceInput",
  fields: () => ({
    name: { type: GraphQLString },
    userId: { type: GraphQLID },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
CreateTaskInput = new GraphQLInputObjectType({
  name: "CreateTaskInput",
  fields: () => ({
    title: { type: GraphQLString },
    statusId: { type: GraphQLID },
    priorityId: { type: GraphQLID },
    sourceId: { type: GraphQLID },
    id: { type: GraphQLID },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
UpdateTaskInput = new GraphQLInputObjectType({
  name: "UpdateTaskInput",
  fields: () => ({
    title: { type: GraphQLString },
    statusId: { type: GraphQLID },
    priorityId: { type: GraphQLID },
    sourceId: { type: GraphQLID },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
LabelEdgeInput = new GraphQLInputObjectType({
  name: "LabelEdgeInput",
  fields: () => ({
    sourceId: { type: new GraphQLNonNull(GraphQLID) },
    targetId: { type: new GraphQLNonNull(GraphQLID) },
  }),
});
CreateStatusInput = new GraphQLInputObjectType({
  name: "CreateStatusInput",
  fields: () => ({
    title: { type: GraphQLString },
    icon: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: GraphQLID },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
UpdateStatusInput = new GraphQLInputObjectType({
  name: "UpdateStatusInput",
  fields: () => ({
    title: { type: GraphQLString },
    icon: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
CreatePriorityInput = new GraphQLInputObjectType({
  name: "CreatePriorityInput",
  fields: () => ({
    title: { type: GraphQLString },
    value: { type: GraphQLInt },
    icon: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: GraphQLID },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
UpdatePriorityInput = new GraphQLInputObjectType({
  name: "UpdatePriorityInput",
  fields: () => ({
    title: { type: GraphQLString },
    value: { type: GraphQLInt },
    icon: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
CreateLabelInput = new GraphQLInputObjectType({
  name: "CreateLabelInput",
  fields: () => ({
    title: { type: GraphQLString },
    color: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: GraphQLID },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
UpdateLabelInput = new GraphQLInputObjectType({
  name: "UpdateLabelInput",
  fields: () => ({
    title: { type: GraphQLString },
    color: { type: GraphQLString },
    sourceId: { type: GraphQLID },
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});
Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    updateUser: {
      type: User,
      args: { input: { type: new GraphQLNonNull(UpdateUserInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    updateWorkspace: {
      type: Workspace,
      args: { input: { type: new GraphQLNonNull(UpdateWorkspaceInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    createTask: {
      type: Task,
      args: { input: { type: new GraphQLNonNull(CreateTaskInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id ?? ctx.util.uuid();
        const timestamp = new Date().toISOString();
        const values = {
          ...args.input,
          id: id,
          createdAt: args.input.createdAt ?? timestamp,
          updatedAt: args.input.updatedAt ?? timestamp,
          __typename: "Task",
        };
        await ctx.db.add(values);
        const result = await ctx.db.get(id);
        return result;
      },
    },
    updateTask: {
      type: Task,
      args: { input: { type: new GraphQLNonNull(UpdateTaskInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    deleteTask: {
      type: Task,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const record = await ctx.db.get(args.id);
        if (!record) {
          throw new Error("Record does not exists");
        }
        await ctx.db.delete(record.id);
        return record;
      },
    },
    createLabelEdge: {
      type: LabelEdge,
      args: { input: { type: new GraphQLNonNull(LabelEdgeInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id ?? ctx.util.uuid();
        const timestamp = new Date().toISOString();
        const values = {
          ...args.input,
          id: id,
          createdAt: args.input.createdAt ?? timestamp,
          updatedAt: args.input.updatedAt ?? timestamp,
          __typename: "LabelEdge",
        };
        await ctx.db.add(values);
        const result = await ctx.db.get(id);
        return result;
      },
    },
    deleteLabelEdge: {
      type: LabelEdge,
      args: { input: { type: new GraphQLNonNull(LabelEdgeInput) } },
      resolve: async (_, args, ctx) => {
        const record = await ctx.db.get(args.id);
        if (!record) {
          throw new Error("Record does not exists");
        }
        await ctx.db.delete(record.id);
        return record;
      },
    },
    createStatus: {
      type: Status,
      args: { input: { type: new GraphQLNonNull(CreateStatusInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id ?? ctx.util.uuid();
        const timestamp = new Date().toISOString();
        const values = {
          ...args.input,
          id: id,
          createdAt: args.input.createdAt ?? timestamp,
          updatedAt: args.input.updatedAt ?? timestamp,
          __typename: "Status",
        };
        await ctx.db.add(values);
        const result = await ctx.db.get(id);
        return result;
      },
    },
    updateStatus: {
      type: Status,
      args: { input: { type: new GraphQLNonNull(UpdateStatusInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    deleteStatus: {
      type: Status,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const record = await ctx.db.get(args.id);
        if (!record) {
          throw new Error("Record does not exists");
        }
        await ctx.db.delete(record.id);
        return record;
      },
    },
    createPriority: {
      type: Priority,
      args: { input: { type: new GraphQLNonNull(CreatePriorityInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id ?? ctx.util.uuid();
        const timestamp = new Date().toISOString();
        const values = {
          ...args.input,
          id: id,
          createdAt: args.input.createdAt ?? timestamp,
          updatedAt: args.input.updatedAt ?? timestamp,
          __typename: "Priority",
        };
        await ctx.db.add(values);
        const result = await ctx.db.get(id);
        return result;
      },
    },
    updatePriority: {
      type: Priority,
      args: { input: { type: new GraphQLNonNull(UpdatePriorityInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    deletePriority: {
      type: Priority,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const record = await ctx.db.get(args.id);
        if (!record) {
          throw new Error("Record does not exists");
        }
        await ctx.db.delete(record.id);
        return record;
      },
    },
    createLabel: {
      type: Label,
      args: { input: { type: new GraphQLNonNull(CreateLabelInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id ?? ctx.util.uuid();
        const timestamp = new Date().toISOString();
        const values = {
          ...args.input,
          id: id,
          createdAt: args.input.createdAt ?? timestamp,
          updatedAt: args.input.updatedAt ?? timestamp,
          __typename: "Label",
        };
        await ctx.db.add(values);
        const result = await ctx.db.get(id);
        return result;
      },
    },
    updateLabel: {
      type: Label,
      args: { input: { type: new GraphQLNonNull(UpdateLabelInput) } },
      resolve: async (_, args, ctx) => {
        const id = args.input.id;
        const updated = await ctx.db.update(id, {
          ...args.input,
          updatedAt: args.input.updatedAt ?? new Date().toISOString(),
        });
        if (!updated) {
          throw new Error("Record to update not found");
        }
        const result = await ctx.db.get(id);
        return result;
      },
    },
    deleteLabel: {
      type: Label,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, args, ctx) => {
        const record = await ctx.db.get(args.id);
        if (!record) {
          throw new Error("Record does not exists");
        }
        await ctx.db.delete(record.id);
        return record;
      },
    },
  }),
});
export const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
  types: [
    User,
    Workspace,
    Task,
    TagProperty,
    Status,
    Priority,
    Label,
    Viewer,
    Node,
    PageInfo,
    SizeFilterInput,
    StringFilterInput,
    IntFilterInput,
    FloatFilterInput,
    BooleanFilterInput,
    IDFilterInput,
    ListFilterInput,
    SortDirection,
    UpdateUserInput,
    UpdateWorkspaceInput,
    LabelConnection,
    LabelEdge,
    LabelFilterInput,
    PriorityConnection,
    PriorityEdge,
    PriorityFilterInput,
    StatusConnection,
    StatusEdge,
    StatusFilterInput,
    CreateTaskInput,
    UpdateTaskInput,
    LabelEdgeFilterInput,
    LabelEdgeInput,
    CreateStatusInput,
    UpdateStatusInput,
    CreatePriorityInput,
    UpdatePriorityInput,
    CreateLabelInput,
    UpdateLabelInput,
    TaskConnection,
    TaskEdge,
    TaskFilterInput,
  ],
});
