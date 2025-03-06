import { TestContext } from "../__fixtures__/TestContext";
import { DocumentNode } from "../src/definition";
import { DexieResolverGenerator } from "../src/plugins/DexieResolversGenerator";
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
  describe("getItem operations", () => {
    it("generate root field resolver", () => {
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

    it("generate connected field resolver", () => {
      const descriptor = {
        dataSource: "test",
        typeName: "Label",
        fieldName: "Task",
        action: {
          type: "getItem",
          key: { id: { ref: "source.taskId" } },
        },
        targetName: "Task",
        returnType: "result",
      } satisfies FieldLoaderDescriptor;

      const result = generator.generate(descriptor);
      expect(printDefinitions([result], "Label.task.ts")).toMatchSnapshot();
    });
  });
});
