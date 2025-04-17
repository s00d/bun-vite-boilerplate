// generate-doc.js
const fs = require("node:fs");
const path = require("node:path");

const OUTPUT_FILE = "docs.md";
const TARGET_DIR = "src";
const SUPPORTED_EXTENSIONS = [".js", ".ts", ".tsx", ".jsx", ".vue", ".json", ".md"];

function walkDir(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function generateDocs() {
  const output = [];
  walkDir(TARGET_DIR, (filePath) => {
    const ext = path.extname(filePath);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) return;

    const relativePath = path.relative(".", filePath);
    const content = fs.readFileSync(filePath, "utf8");

    output.push(`## ${relativePath}\n`);
    output.push(`\`\`\`${ext.slice(1)}`);
    output.push(content.trim());
    output.push("```\n");
  });

  fs.writeFileSync(OUTPUT_FILE, output.join("\n"), "utf8");
  console.log(`✔ Документация сгенерирована в ${OUTPUT_FILE}`);
}

generateDocs();
