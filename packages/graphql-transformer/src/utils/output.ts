/* eslint-disable security/detect-non-literal-fs-filename */

import fs from "node:fs";
import path from "node:path";

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
  const dirPath = path.resolve(loc);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  }

  if (fs.readdirSync(dirPath).length) {
    return cleanDir(dirPath);
  }

  return dirPath;
}
