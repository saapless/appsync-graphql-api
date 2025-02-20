import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransformer, GraphQLTransformer } from "../src/transformer";
import { FieldNode, NamedTypeNode, ObjectNode } from "../src/definition";
import { SchemaValidationError } from "../src/utils/errors";
import { TEST_DS_CONFIG } from "../__fixtures__/constants";

const schema = /* GraphQL */ `
  enum UserStatus {
    ACTIVE
    DISABLED
    SUSPENDED
  }

  type User @model {
    id: ID!

    firstName: String
    lastName: String
    email: AWSEmail
    picture: AWSURL
    status: UserStatus @readOnly
  }

  type Task @model(operations: [upsert, delete]) {
    id: ID!

    title: String
    content: AWSJSON
    schedule: Schedule
    rrule: RRule
    recurrenceId: ID
    occurrenceId: String

    # Connections
    labels: Label @hasMany(relation: manyToMany)
    subtasks: Task @hasMany
    artifacts: Artifact @hasMany
    occurrences: Task @hasMany
  }

  type RRule {
    dtStart: AWSDateTime
    until: AWSDateTime
    ruleStr: String
  }

  type Schedule {
    startDate: DateTimeZone
    duration: String
    dueDate: DateTimeZone
  }

  type DateTimeZone {
    date: AWSDateTime
    timezone: String
  }

  type Label @model(operations: [upsert, delete]) {
    id: ID!
    name: String
    color: String
  }

  type File @model(operations: [upsert, delete]) {
    name: String
    size: Int
    url: AWSURL
    mimeType: String
  }

  type TimeTracker @model(operations: [upsert, delete]) {
    duration: String
    logs: [TimeLog!]
  }

  type TimeLog {
    action: TimeLogAction!
    timestamp: AWSTimestamp!
  }

  enum TimeLogAction {
    START
    PAUSE
    END
    LOG
  }

  union Artifact = File | TimeTracker

  type Viewer {
    user: User @hasOne(key: { ref: "identity.sub" })
    tasks: Task @hasMany(key: { ref: "identity.sub" }, index: "bySourceId")
    labels: Label @hasMany(key: { ref: "identity.sub" }, index: "bySourceId")
  }

  type Query {
    viewer: Viewer!
  }
`;

describe("GraphQLTransformer", () => {
  const transformer = createTransformer({
    definition: schema,
    mode: "development",
    outDir: resolve(dirname(fileURLToPath(import.meta.url)), "out"),
    dataSourceConfig: TEST_DS_CONFIG,
  });

  describe("createTransformer factory", () => {
    it("throws if empty definition", () => {
      expect(() => createTransformer({ definition: "" })).toThrow();
    });

    it("creates new GraphQLTransformer instance", () => {
      expect(transformer).toBeDefined();
      expect(transformer).toBeInstanceOf(GraphQLTransformer);
    });

    it("adds default plugins list", () => {
      expect(transformer.plugins).toHaveLength(6);
    });
  });

  describe("given invalid schema", () => {
    it("throws SchemaValidationError", () => {
      const transformer = createTransformer({
        definition: schema.replace("type Viewer", "type Viewer2"),
        dataSourceConfig: TEST_DS_CONFIG,
      });

      expect(() => transformer.transform()).toThrow(SchemaValidationError);
    });
  });

  describe("runs schema transformations", () => {
    transformer.transform();
    const context = transformer.context;

    it("copies extended fields", () => {
      const viewerType = context.document.getNode("Viewer") as ObjectNode;

      expect(viewerType.getField("user")).toBeInstanceOf(FieldNode);
      expect(viewerType.getField("tasks")).toBeInstanceOf(FieldNode);
    });

    describe("NodeInterfacePlugin trnsformations", () => {
      it("adds valid `node` field to Query", () => {
        const nodeField = (context.document.getNode("Query") as ObjectNode)?.getField("node");
        const nodeFieldTypename = (nodeField?.type as NamedTypeNode).name;

        expect(nodeField).toBeDefined();
        expect(nodeField).toBeInstanceOf(FieldNode);
        expect(nodeField?.hasArgument("id")).toStrictEqual(true);

        expect(nodeField?.type).toBeInstanceOf(NamedTypeNode);
        expect(nodeFieldTypename).toStrictEqual("Node");
      });

      it("extends models with Node interface", () => {
        const userNode = context.document.getNode("User") as ObjectNode;
        const taskNode = context.document.getNode("Task") as ObjectNode;

        expect(userNode.hasInterface("Node")).toBeTruthy();
        expect(taskNode.hasInterface("Node")).toBeTruthy();
      });
    });

    describe("ModelPlugin", () => {
      it("created query fields for model", () => {
        const queryNode = context.document.getQueryNode();

        expect(queryNode.getField("getUser")).toBeInstanceOf(FieldNode);
        expect(queryNode.getField("listUsers")).toBeInstanceOf(FieldNode);

        expect(queryNode.getField("getTask")).not.toBeDefined();
        expect(queryNode.getField("listTasks")).not.toBeDefined();
      });
      it("created mutation fields for model", () => {
        const mutationNode = context.document.getMutationNode();

        expect(mutationNode.getField("createUser")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("updateUser")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("deleteUser")).toBeInstanceOf(FieldNode);

        expect(mutationNode.getField("upsertTask")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("deleteTask")).toBeInstanceOf(FieldNode);
      });

      it("created operation inputs & types", () => {
        expect(context.document.getNode("CreateUserInput")).toBeDefined();
        expect(context.document.getNode("UpdateUserInput")).toBeDefined();
        expect(context.document.getNode("DeleteUserInput")).toBeDefined();
        expect(context.document.getNode("UpsertTaskInput")).toBeDefined();
        expect(context.document.getNode("DeleteTaskInput")).toBeDefined();
      });
    });
  });
});
