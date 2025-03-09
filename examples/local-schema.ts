import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTransformer } from "@saapless/graphql-transformer";
import { AWSTypesPlugin, ExecutableSchemaGenerator } from "@saapless/graphql-transformer/plugins";

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
    createdAt: String
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
    occurrences: Task @hasMany
    subtasks: Task @hasMany
    artifacts: Artifact @hasMany
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
    user: User @hasOne(key: { ref: "source.userId" })
    tasks: Task @hasMany(key: [{ ref: "source.userId" }, { eq: "Task" }], index: "sourceId")
    labels: Label @hasMany(key: [{ ref: "source.userId" }, { eq: "Label" }], index: "sourceId")
  }

  type Query {
    viewer: Viewer @hasOne(key: { eq: "root:viewer" })
  }
`;

const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "__generated__");

const transformer = createTransformer({
  definition: schema,
  outDir: __dirname,
  plugins: [AWSTypesPlugin, ExecutableSchemaGenerator],
});

const start = performance.now();

transformer.transform();

console.log(`Transformed schema in ${(performance.now() - start).toFixed(2)}ms`);
