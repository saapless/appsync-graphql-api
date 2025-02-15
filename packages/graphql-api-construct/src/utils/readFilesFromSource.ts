import { readFileSync } from "node:fs";
import fg from "fast-glob";

export function readFilesFromSource(source: string | string[]) {
  if (!Array.isArray(source)) {
    source = [source];
  }

  const paths = fg.globSync(source, {
    absolute: true,
  });

  if (paths.length === 0) {
    throw new Error(`No schema definition found at ${source}`);
  }

  let definition: string = "";

  for (const path of paths) {
    definition += readFileSync(path, { encoding: "utf-8" });
  }

  return definition;
}
