import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resolver } from "../src/utils/resolver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Resolver utility", () => {
  it("create config from source", () => {
    const config = Resolver.fromSource(path.resolve(__dirname, "*.ts"));

    expect(config.map((r) => r.getConfig())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Resolver.test",
          source: expect.stringContaining("graphql-api-construct/__tests__/Resolver.test.ts"),
        }),
      ])
    );
  });

  it("create config from object", () => {
    const config = Resolver.create({
      name: "Query.user",
      source: "./Query.user.ts",
    });

    expect(config.getConfig()).toEqual(
      expect.objectContaining({
        name: "Query.user",
        source: "./Query.user.ts",
      })
    );
  });
});
