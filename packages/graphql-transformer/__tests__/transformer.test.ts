import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTransformer, GraphQLTransformer } from "../src/transformer";
import { FieldResolver } from "../src/resolver";
import {
  DirectiveDefinitionNode,
  EnumNode,
  FieldNode,
  NamedTypeNode,
  ObjectNode,
  ScalarNode,
} from "../src/parser";
import { SchemaValidationError } from "../src/utils/errors";

// eslint-disable-next-line security/detect-non-literal-fs-filename
const schema = readFileSync(join(__dirname, "./schema.graphql"), "utf-8");

describe("GraphQLTransformer", () => {
  const transformer = createTransformer({ definition: schema });

  describe("createTransformer factory", () => {
    it("throws if empty definition", () => {
      expect(() => createTransformer({ definition: "" })).toThrow();
    });

    it("creates new GraphQLTransformer instance", () => {
      expect(transformer).toBeDefined();
      expect(transformer).toBeInstanceOf(GraphQLTransformer);
    });

    it("adds default plugins list", () => {
      expect(transformer.plugins).toHaveLength(5);
    });
  });

  describe("given invalid schema", () => {
    it("throws SchemaValidationError", () => {
      const transformer = createTransformer({
        definition: schema.replace("type Viewer", "type Viewer2"),
      });

      expect(() => transformer.transform()).toThrow(SchemaValidationError);
    });
  });

  describe("runs schema transformations", () => {
    const result = transformer.transform();

    it("creates valid schema", () => {
      const schema = result.document.print();
      expect(schema).toMatchSnapshot();
    });

    it("copies extended fields", () => {
      const viewerType = result.document.getNode("Viewer") as ObjectNode;

      expect(viewerType.getField("user")).toBeInstanceOf(FieldNode);
      expect(viewerType.getField("tasks")).toBeInstanceOf(FieldNode);
    });

    describe("AWSTypesPlugin transformations", () => {
      it("adds AWS specific scalars", () => {
        const scalars = [
          "AWSDate",
          "AWSTime",
          "AWSDateTime",
          "AWSTimestamp",
          "AWSEmail",
          "AWSJSON",
          "AWSURL",
          "AWSPhone",
          "AWSIPAddress",
        ];

        scalars.forEach((scalar) => {
          expect(result.document.getNode(scalar)).toBeInstanceOf(ScalarNode);
        });
      });

      it("adds AWS specific directives", () => {
        const directives = [
          "aws_api_key",
          "aws_auth",
          "aws_cognito_user_pools",
          "aws_lambda",
          "aws_oidc",
          "aws_subscribe",
        ];

        directives.forEach((directive) => {
          expect(result.document.getNode(directive)).toBeInstanceOf(DirectiveDefinitionNode);
        });
      });
    });

    describe("NodeInterfacePlugin trnsformations", () => {
      it("adds valid `node` field to Query", () => {
        const nodeField = (result.document.getNode("Query") as ObjectNode)?.getField("node");
        const nodeFieldTypename = (nodeField?.type as NamedTypeNode).name;

        expect(nodeField).toBeDefined();
        expect(nodeField).toBeInstanceOf(FieldNode);
        expect(nodeField?.hasArgument("id")).toStrictEqual(true);

        expect(nodeField?.type).toBeInstanceOf(NamedTypeNode);
        expect(nodeFieldTypename).toStrictEqual("Node");
      });

      it("adds Query.node resolver", () => {
        const nodeResolver = result.resolvers.get("Query.node");

        expect(nodeResolver).toBeInstanceOf(FieldResolver);
        expect(nodeResolver?.print()).toMatchSnapshot();
      });

      it("extends models with Node interface", () => {
        const userNode = result.document.getNode("User") as ObjectNode;
        const taskNode = result.document.getNode("Task") as ObjectNode;

        expect(userNode.hasInterface("Node")).toBeTruthy();
        expect(taskNode.hasInterface("Node")).toBeTruthy();
      });
    });

    describe("ModelPlugin", () => {
      it("adds @model directive definition", () => {
        const modelDirective = result.document.getNode("model");
        const operationsEnum = result.document.getNode("ModelOperation");

        expect(modelDirective).toBeInstanceOf(DirectiveDefinitionNode);
        expect(operationsEnum).toBeInstanceOf(EnumNode);
      });

      it("created query fields for model", () => {
        const queryNode = result.document.getQueryNode();

        expect(queryNode.getField("getUser")).toBeDefined();
        expect(queryNode.getField("listUsers")).toBeDefined();
        expect(queryNode.getField("getUser")).toBeInstanceOf(FieldNode);
        expect(queryNode.getField("listUsers")).toBeInstanceOf(FieldNode);

        expect(queryNode.getField("getTask")).not.toBeDefined();
        expect(queryNode.getField("listTasks")).not.toBeDefined();
      });
      it("created mutation fields for model", () => {
        const mutationNode = result.document.getMutationNode();

        expect(mutationNode.getField("createUser")).toBeDefined();
        expect(mutationNode.getField("updateUser")).toBeDefined();
        expect(mutationNode.getField("deleteUser")).toBeDefined();
        expect(mutationNode.getField("createUser")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("updateUser")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("deleteUser")).toBeInstanceOf(FieldNode);

        expect(mutationNode.getField("upsertTask")).toBeDefined();
        expect(mutationNode.getField("deleteTask")).toBeDefined();
        expect(mutationNode.getField("upsertTask")).toBeInstanceOf(FieldNode);
        expect(mutationNode.getField("deleteTask")).toBeInstanceOf(FieldNode);
      });

      it("created operation inputs & types", () => {
        expect(result.document.getNode("UserFilterInput")).toBeDefined();
        expect(result.document.getNode("CreateUserInput")).toBeDefined();
        expect(result.document.getNode("UpdateUserInput")).toBeDefined();
        expect(result.document.getNode("DeleteUserInput")).toBeDefined();
        expect(result.document.getNode("UpsertTaskInput")).toBeDefined();
        expect(result.document.getNode("DeleteTaskInput")).toBeDefined();
      });

      it("created operation resolvers", () => {
        expect(result.resolvers.get("Query.getUser")).toBeDefined();
        expect(result.resolvers.get("Query.listUsers")).toBeDefined();

        expect(result.resolvers.get("Mutation.createUser")).toBeDefined();
        expect(result.resolvers.get("Mutation.updateUser")).toBeDefined();
        expect(result.resolvers.get("Mutation.deleteUser")).toBeDefined();
        expect(result.resolvers.get("Mutation.upsertTask")).toBeDefined();
        expect(result.resolvers.get("Mutation.deleteTask")).toBeDefined();
      });
    });
  });
});
