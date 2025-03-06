import { TestContext } from "../__fixtures__/TestContext";
import { DocumentNode } from "../src/definition";
import { DexieResolverGenerator } from "../src/generators/DexieResolverGenerator";
import { FieldLoaderDescriptor, printDefinitions } from "../src/utils";

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

const generator = new DexieResolverGenerator(context);

describe("DexieResolverGenerator", () => {
  it("generates getItem resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Query",
      fieldName: "getTask",
      action: {
        type: "getItem",
        key: { id: { ref: "args.id" } },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.getTask.ts")).toMatchSnapshot();
  });

  it("generates getItem resolver with nested key", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Query",
      fieldName: "getTask",
      action: {
        type: "getItem",
        key: { id: { ref: "args.id" }, __typename: { eq: "Task" } },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.getTask.ts")).toMatchSnapshot();
  });

  it("generates batchGetItems resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Label",
      fieldName: "edges",
      action: {
        type: "batchGetItems",
        key: { id: { ref: "source.keys" } },
      },
      targetName: "Label",
      returnType: "edges",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.listTasks.ts")).toMatchSnapshot();
  });

  it("generates queryItems resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Query",
      fieldName: "listTasks",
      action: {
        type: "queryItems",
        key: { id: { eq: "Task" } },
        index: "__typename",
      },
      targetName: "Task",
      returnType: "connection",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Query.listTasks.ts")).toMatchSnapshot();
  });

  it("generates createItem resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Mutation",
      fieldName: "createTask",
      action: {
        type: "putItem",
        key: { id: { ref: "args.input.id" } },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.createTask.ts")).toMatchSnapshot();
  });

  it("generates updateItem resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Mutation",
      fieldName: "updateTask",
      action: {
        type: "updateItem",
        key: { id: { ref: "args.input.id" } },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.updateTask.ts")).toMatchSnapshot();
  });

  it("generates deleteItem resolver", () => {
    const descriptor = {
      dataSource: "test",
      typeName: "Mutation",
      fieldName: "deleteTask",
      action: {
        type: "removeItem",
        key: { id: { ref: "args.id" } },
      },
      targetName: "Task",
      returnType: "result",
    } satisfies FieldLoaderDescriptor;

    const result = generator.generate(descriptor);
    expect(printDefinitions([result], "Mutation.deleteTask.ts")).toMatchSnapshot();
  });
});
