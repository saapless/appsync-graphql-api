import { DataSourceManagerConfig } from "../src/context/DataSourceManager";

export const TEST_DS_CONFIG = {
  primaryDataSourceName: "TestDataSource",
  dataSources: {
    TestDataSource: {
      type: "DYNAMO_DB",
      config: {
        tableName: "TestTable",
      },
    },
    NoneDataSource: {
      type: "NONE",
    },
  },
} satisfies DataSourceManagerConfig;
