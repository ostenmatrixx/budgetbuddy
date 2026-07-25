import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const sourceRoot = "src";
const subsetScriptPath = "scripts/subset-material-symbols.sh";
const iconNames = new Set();

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}

function collectOutputStrings(node) {
  if (!node) {
    return;
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
    const value = node.text.trim();
    if (/^[a-z][a-z0-9_]*$/.test(value)) {
      iconNames.add(value);
    }
    return;
  }

  if (ts.isConditionalExpression(node)) {
    collectOutputStrings(node.whenTrue);
    collectOutputStrings(node.whenFalse);
    return;
  }

  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    collectOutputStrings(node.expression);
  }
}

for (const sourcePath of collectSourceFiles(sourceRoot)) {
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourcePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const classAttribute = node.openingElement.attributes.properties.find(
        (attribute) =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === "className"
      );

      if (classAttribute?.getText(sourceFile).includes("material-symbols-outlined")) {
        node.children.forEach((child) => {
          if (ts.isJsxExpression(child)) {
            collectOutputStrings(child.expression);
          } else {
            collectOutputStrings(child);
          }
        });
      }
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = node.name.getText(sourceFile);
      const openingElement = node.parent.parent;
      const componentName = ts.isJsxOpeningLikeElement(openingElement)
        ? openingElement.tagName.getText(sourceFile)
        : "";
      const isIconAttribute =
        attributeName === "icon" || (attributeName === "name" && componentName === "MaterialIcon");

      if (isIconAttribute && node.initializer) {
        if (ts.isJsxExpression(node.initializer)) {
          collectOutputStrings(node.initializer.expression);
        } else {
          collectOutputStrings(node.initializer);
        }
      }
    }

    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(sourceFile).replaceAll('"', "") === "icon"
    ) {
      collectOutputStrings(node.initializer);
    }

    if (
      ts.isFunctionLike(node) &&
      node.name &&
      /icon/i.test(node.name.getText(sourceFile)) &&
      node.body
    ) {
      function visitIconFunction(child) {
        if (ts.isReturnStatement(child)) {
          collectOutputStrings(child.expression);
        }
        ts.forEachChild(child, visitIconFunction);
      }
      visitIconFunction(node.body);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const subsetScript = fs.readFileSync(subsetScriptPath, "utf8");
const configuredBlock = subsetScript.match(/icons=\(\n([\s\S]*?)\n\)/);

if (!configuredBlock) {
  throw new Error(`Unable to read the icon list from ${subsetScriptPath}.`);
}

const configuredIcons = new Set(
  configuredBlock[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
);
const missingIcons = [...iconNames].filter((icon) => !configuredIcons.has(icon)).sort();

if (missingIcons.length > 0) {
  console.error(`Material Symbols subset is missing: ${missingIcons.join(", ")}`);
  process.exit(1);
}

console.log(`Material Symbols subset covers ${iconNames.size} icons used by the application.`);
