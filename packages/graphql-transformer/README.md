# Saapless GraphQL Transformer

Highly opinionated GraphQL SDL transformers.

## Features

- DynamoDB as primary/default data source;
- Single table design;
- JS runtime resolvers;

## Reference

- Directives
  - `@model`
  - `@auth`
  - `@connection`
  - `@resolver`
  - `@dataSource`

## Resolvers

Stages: `REQUEST` -> `AUTH` -> `LOAD` -> `RESPONSE`
