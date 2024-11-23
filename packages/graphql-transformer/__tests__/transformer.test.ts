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
      expect(transformer.plugins).toHaveLength(6);
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
    const context = transformer.context;

    it("respond with valid output", () => {
      expect(result).toMatchSnapshot();
    });

    it("copies extended fields", () => {
      const viewerType = context.document.getNode("Viewer") as ObjectNode;

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
          expect(context.document.getNode(scalar)).toBeInstanceOf(ScalarNode);
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
          expect(context.document.getNode(directive)).toBeInstanceOf(DirectiveDefinitionNode);
        });
      });
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

      it("adds Query.node resolver", () => {
        const nodeResolver = context.resolvers.get("Query.node");
        expect(nodeResolver).toBeInstanceOf(FieldResolver);
      });

      it("extends models with Node interface", () => {
        const userNode = context.document.getNode("User") as ObjectNode;
        const taskNode = context.document.getNode("Task") as ObjectNode;

        expect(userNode.hasInterface("Node")).toBeTruthy();
        expect(taskNode.hasInterface("Node")).toBeTruthy();
      });
    });

    describe("ModelPlugin", () => {
      it("adds @model directive definition", () => {
        const modelDirective = context.document.getNode("model");
        const operationsEnum = context.document.getNode("ModelOperation");

        expect(modelDirective).toBeInstanceOf(DirectiveDefinitionNode);
        expect(operationsEnum).toBeInstanceOf(EnumNode);
      });

      it("created query fields for model", () => {
        const queryNode = context.document.getQueryNode();

        expect(queryNode.getField("getUser")).toBeDefined();
        expect(queryNode.getField("listUsers")).toBeDefined();
        expect(queryNode.getField("getUser")).toBeInstanceOf(FieldNode);
        expect(queryNode.getField("listUsers")).toBeInstanceOf(FieldNode);

        expect(queryNode.getField("getTask")).not.toBeDefined();
        expect(queryNode.getField("listTasks")).not.toBeDefined();
      });
      it("created mutation fields for model", () => {
        const mutationNode = context.document.getMutationNode();

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
        expect(context.document.getNode("UserFilterInput")).toBeDefined();
        expect(context.document.getNode("CreateUserInput")).toBeDefined();
        expect(context.document.getNode("UpdateUserInput")).toBeDefined();
        expect(context.document.getNode("DeleteUserInput")).toBeDefined();
        expect(context.document.getNode("UpsertTaskInput")).toBeDefined();
        expect(context.document.getNode("DeleteTaskInput")).toBeDefined();
      });

      it("created operation resolvers", () => {
        expect(context.resolvers.get("Query.getUser")).toBeDefined();
        expect(context.resolvers.get("Query.listUsers")).toBeDefined();

        expect(context.resolvers.get("Mutation.createUser")).toBeDefined();
        expect(context.resolvers.get("Mutation.updateUser")).toBeDefined();
        expect(context.resolvers.get("Mutation.deleteUser")).toBeDefined();
        expect(context.resolvers.get("Mutation.upsertTask")).toBeDefined();
        expect(context.resolvers.get("Mutation.deleteTask")).toBeDefined();
      });
    });
  });
});
