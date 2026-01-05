import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default function getPackage() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
  );

  return pkg;
}
