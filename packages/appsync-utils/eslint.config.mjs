import appsync from "@aws-appsync/eslint-plugin";
import tseslint from "typescript-eslint";
import baseConfig from "../../eslint.config.mjs";

export default tseslint.config(appsync.configs.recommended, ...baseConfig);
