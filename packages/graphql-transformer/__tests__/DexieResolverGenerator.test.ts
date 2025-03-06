import { TestContext } from "../__fixtures__/TestContext";
import { ResolverDescriptor } from "../src/context";
import { DocumentNode } from "../src/definition";
import { DexieResolverGenerator } from "../src/generators/DexieResolverGenerator";
import { printDefinitions } from "../src/utils";

const context = new TestContext({
  document: DocumentNode.fromSource(/* GraphQL */ `
    type Task {
      id: ID!
      title: String!
      done: Boolean!
      labels: LabelConnection
    }

    type Label {
      id: ID!
      name: String!
      taskId: string
      task: Task
    }

    type LabelConnection {
      edges: [LabelEdge!]!
      pageInfo: PageInfo
    }

    type LabelEdge {
      cursor: String
      node: Label
    }

    type TaskConnection {
      edges: [TaskEdge!]!
      pageInfo: PageInfo
    }

    type TaskEdge {
      cursor: String
      node: Task
    }

    type PageInfo {
      hasNextPage: Boolean!
      hasPreviousPage: Boolean!
      startCursor: String
      endCursor: String
    }

    input CreateTaskInput {
      id: ID
      title: String!
    }

    input UpdateTaskInput {
      id: ID!
      title: String
      done: Boolean
    }

    input CreateLabelInput {
      id: ID
      name: String!
    }

    input UpdateLabelInput {
      id: ID!
      name: String
    }

    type Query {
      getTask(id: ID!): Task
      listTasks: TaskConnection!
    }

    type Mutation {
      createTask(input: CreateTaskInput!): Task
      updateTask(input: UpdateTaskInput!): Task
      deleteTask(id: ID!): Task
      createLabel(input: CreateLabelInput!): Label
      updateLabel(input: UpdateLabelInput!): Label
      deleteLabel(id: ID!): Label
    }
  `),
  outputDirectory: "__test__",
});

const generator = new DexieResolverGenerator(context, []);

describe("DexieResolverGenerator", () => {
  it("generates getItem resolver", () => {
    const descriptor = {
      typeName: "Query",
      fieldName: "getTask",
      operation: {
        type: "get",
        key: { ref: "args.id" },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.getTask.ts")).toMatchSnapshot();
  });

  it("generates getItem resolver with nested key", () => {
    const descriptor = {
      typeName: "Query",
      fieldName: "getTask",
      operation: {
        type: "get",
        key: [{ ref: "args.id" }, { eq: "Task" }],
      },
      targetName: "Task",
      returnType: "result",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.getTask.ts")).toMatchSnapshot();
  });

  it("generates batchGetItems resolver", () => {
    const descriptor = {
      typeName: "Label",
      fieldName: "edges",
      operation: {
        type: "batchGet",
        key: { ref: "source.keys" },
      },
      targetName: "Label",
      returnType: "edges",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.listTasks.ts")).toMatchSnapshot();
  });

  it("generates queryItems resolver", () => {
    const descriptor = {
      typeName: "Query",
      fieldName: "listTasks",
      operation: {
        type: "query",
        key: { eq: "Task" },
        index: "typename",
      },
      targetName: "Task",
      returnType: "connection",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.listTasks.ts")).toMatchSnapshot();
  });

  it("generates createItem resolver", () => {
    const descriptor = {
      typeName: "Mutation",
      fieldName: "createTask",
      operation: {
        type: "create",
        key: { ref: "args.input.id" },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.createTask.ts")).toMatchSnapshot();
  });

  it("generates updateItem resolver", () => {
    const descriptor = {
      typeName: "Mutation",
      fieldName: "updateTask",
      operation: {
        type: "update",
        key: { ref: "args.input.id" },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.updateTask.ts")).toMatchSnapshot();
  });

  it("generates deleteItem resolver", () => {
    const descriptor = {
      typeName: "Mutation",
      fieldName: "deleteTask",
      operation: {
        type: "delete",
        key: { ref: "args.id" },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies ResolverDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.deleteTask.ts")).toMatchSnapshot();
  });
});
