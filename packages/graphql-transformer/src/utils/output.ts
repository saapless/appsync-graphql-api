import fs, { writeFileSync } from "node:fs";
import path from "node:path";
import prettier from "@prettier/sync";
import { buildSync } from "esbuild";

export function getOrCreateDir(loc: string) {
  const dirPath = path.resolve(loc);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

export function cleanDir(loc: string) {
  const dirPath = path.resolve(loc);

  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });

    fs.mkdirSync(dirPath);
  }

  return dirPath;
}

export function ensureOutputDirectory(loc: string) {
  const dirPath = getOrCreateDir(loc);

  if (fs.readdirSync(dirPath).length) {
    return cleanDir(dirPath);
  }

  return dirPath;
}

export function printFile(path: string, content: string) {
  return writeFileSync(path, content, { encoding: "utf-8" });
}

export function prettyPrintFile(path: string, content: string) {
  return printFile(path, prettier.format(content, { parser: "typescript" }));
}

export function buildPaths(paths: string[], outDir: string) {
  return buildSync({
    entryPoints: paths,
    outdir: outDir,
    target: "esnext",
    sourcemap: "inline",
    sourcesContent: false,
    treeShaking: true,
    platform: "node",
    format: "esm",
    minify: false,
    bundle: true,
    write: false,
    external: ["@aws-appsync/utils"],
  });
}
