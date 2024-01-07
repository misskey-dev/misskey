// vite.config.ts
import path from "path";
import pluginReplace from "file:///home/misskey/core/node_modules/.pnpm/@rollup+plugin-replace@5.0.5_rollup@4.9.0/node_modules/@rollup/plugin-replace/dist/es/index.js";
import pluginVue from "file:///home/misskey/core/node_modules/.pnpm/@vitejs+plugin-vue@4.5.2_vite@5.0.10_vue@3.3.11/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "file:///home/misskey/core/node_modules/.pnpm/vite@5.0.10_@types+node@20.10.4_sass@1.69.5_terser@5.26.0/node_modules/vite/dist/node/index.js";

// ../../locales/index.js
import * as fs from "node:fs";
import * as yaml from "file:///home/misskey/core/node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml/dist/js-yaml.mjs";
var __vite_injected_original_import_meta_url = "file:///home/misskey/core/locales/index.js";
var merge = (...args) => args.reduce((a, c) => ({
  ...a,
  ...c,
  ...Object.entries(a).filter(([k]) => c && typeof c[k] === "object").reduce((a2, [k, v]) => (a2[k] = merge(v, c[k]), a2), {})
}), {});
var languages = [
  "ar-SA",
  "cs-CZ",
  "da-DK",
  "de-DE",
  "en-US",
  "es-ES",
  "fr-FR",
  "id-ID",
  "it-IT",
  "ja-JP",
  "ja-KS",
  "kab-KAB",
  "kn-IN",
  "ko-KR",
  "nl-NL",
  "no-NO",
  "pl-PL",
  "pt-PT",
  "ru-RU",
  "sk-SK",
  "th-TH",
  "ug-CN",
  "uk-UA",
  "vi-VN",
  "zh-CN",
  "zh-TW"
];
var primaries = {
  "en": "US",
  "ja": "JP",
  "zh": "CN"
};
var clean = (text) => text.replace(new RegExp(String.fromCodePoint(8), "g"), "");
function build() {
  const locales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`${c}.yml`, __vite_injected_original_import_meta_url), "utf-8"))) || {}, a), {});
  const removeEmpty = (obj) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === "") {
        delete obj[k];
      } else if (typeof v === "object") {
        removeEmpty(v);
      }
    }
    return obj;
  };
  removeEmpty(locales);
  return Object.entries(locales).reduce((a, [k, v]) => (a[k] = (() => {
    const [lang] = k.split("-");
    switch (k) {
      case "ja-JP":
        return v;
      case "ja-KS":
      case "en-US":
        return merge(locales["ja-JP"], v);
      default:
        return merge(
          locales["ja-JP"],
          locales["en-US"],
          locales[`${lang}-${primaries[lang]}`] ?? {},
          v
        );
    }
  })(), a), {});
}
var locales_default = build();

// ../../package.json
var package_default = {
  name: "misskey",
  version: "2023.12.0-beta.5.papi",
  codename: "nasubi",
  repository: {
    type: "git",
    url: "https://github.com/n1lsqn/misskey.git"
  },
  packageManager: "pnpm@8.12.1",
  workspaces: [
    "packages/frontend",
    "packages/backend",
    "packages/sw"
  ],
  private: true,
  scripts: {
    "build-pre": "node ./scripts/build-pre.js",
    "build-assets": "node ./scripts/build-assets.mjs",
    build: "pnpm build-pre && pnpm -r build && pnpm build-assets",
    "build-storybook": "pnpm --filter frontend build-storybook",
    "build-misskey-js-with-types": "pnpm --filter backend build && pnpm --filter backend generate-api-json && ncp packages/backend/built/api.json packages/misskey-js/generator/api.json && pnpm --filter misskey-js update-autogen-code && pnpm --filter misskey-js build",
    start: "pnpm check:connect && cd packages/backend && node ./built/boot/entry.js",
    "start:test": "cd packages/backend && cross-env NODE_ENV=test node ./built/boot/entry.js",
    init: "pnpm migrate",
    migrate: "cd packages/backend && pnpm migrate",
    revert: "cd packages/backend && pnpm revert",
    "check:connect": "cd packages/backend && pnpm check:connect",
    migrateandstart: "pnpm migrate && pnpm start",
    watch: "pnpm dev",
    dev: "node scripts/dev.mjs",
    lint: "pnpm -r lint",
    "cy:open": "pnpm cypress open --browser --e2e --config-file=cypress.config.ts",
    "cy:run": "pnpm cypress run",
    e2e: "pnpm start-server-and-test start:test http://localhost:61812 cy:run",
    jest: "cd packages/backend && pnpm jest",
    "jest-and-coverage": "cd packages/backend && pnpm jest-and-coverage",
    test: "pnpm -r test",
    "test-and-coverage": "pnpm -r test-and-coverage",
    clean: "node ./scripts/clean.js",
    "clean-all": "node ./scripts/clean-all.js",
    cleanall: "pnpm clean-all"
  },
  resolutions: {
    chokidar: "3.5.3",
    lodash: "4.17.21"
  },
  dependencies: {
    cssnano: "6.0.1",
    execa: "8.0.1",
    "js-yaml": "4.1.0",
    katex: "0.16.8",
    postcss: "8.4.32",
    terser: "5.26.0",
    typescript: "5.3.3"
  },
  devDependencies: {
    "@typescript-eslint/eslint-plugin": "6.14.0",
    "@typescript-eslint/parser": "6.14.0",
    "cross-env": "7.0.3",
    cypress: "13.6.1",
    eslint: "8.56.0",
    ncp: "2.0.0",
    nodemon: "3.0.2",
    "start-server-and-test": "2.0.3"
  },
  optionalDependencies: {
    "@tensorflow/tfjs-core": "4.4.0"
  }
};

// lib/rollup-plugin-unwind-css-module-class-name.ts
import { generate } from "file:///home/misskey/core/node_modules/.pnpm/astring@1.8.6/node_modules/astring/dist/astring.mjs";

// ../../node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/walker.js
var WalkerBase = class {
  constructor() {
    this.should_skip = false;
    this.should_remove = false;
    this.replacement = null;
    this.context = {
      skip: () => this.should_skip = true,
      remove: () => this.should_remove = true,
      replace: (node) => this.replacement = node
    };
  }
  /**
   * @template {Node} Parent
   * @param {Parent | null | undefined} parent
   * @param {keyof Parent | null | undefined} prop
   * @param {number | null | undefined} index
   * @param {Node} node
   */
  replace(parent, prop, index, node) {
    if (parent && prop) {
      if (index != null) {
        parent[prop][index] = node;
      } else {
        parent[prop] = node;
      }
    }
  }
  /**
   * @template {Node} Parent
   * @param {Parent | null | undefined} parent
   * @param {keyof Parent | null | undefined} prop
   * @param {number | null | undefined} index
   */
  remove(parent, prop, index) {
    if (parent && prop) {
      if (index !== null && index !== void 0) {
        parent[prop].splice(index, 1);
      } else {
        delete parent[prop];
      }
    }
  }
};

// ../../node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/sync.js
var SyncWalker = class extends WalkerBase {
  /**
   *
   * @param {SyncHandler} [enter]
   * @param {SyncHandler} [leave]
   */
  constructor(enter, leave) {
    super();
    this.should_skip = false;
    this.should_remove = false;
    this.replacement = null;
    this.context = {
      skip: () => this.should_skip = true,
      remove: () => this.should_remove = true,
      replace: (node) => this.replacement = node
    };
    this.enter = enter;
    this.leave = leave;
  }
  /**
   * @template {Node} Parent
   * @param {Node} node
   * @param {Parent | null} parent
   * @param {keyof Parent} [prop]
   * @param {number | null} [index]
   * @returns {Node | null}
   */
  visit(node, parent, prop, index) {
    if (node) {
      if (this.enter) {
        const _should_skip = this.should_skip;
        const _should_remove = this.should_remove;
        const _replacement = this.replacement;
        this.should_skip = false;
        this.should_remove = false;
        this.replacement = null;
        this.enter.call(this.context, node, parent, prop, index);
        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }
        if (this.should_remove) {
          this.remove(parent, prop, index);
        }
        const skipped = this.should_skip;
        const removed = this.should_remove;
        this.should_skip = _should_skip;
        this.should_remove = _should_remove;
        this.replacement = _replacement;
        if (skipped)
          return node;
        if (removed)
          return null;
      }
      let key;
      for (key in node) {
        const value = node[key];
        if (value && typeof value === "object") {
          if (Array.isArray(value)) {
            const nodes = (
              /** @type {Array<unknown>} */
              value
            );
            for (let i = 0; i < nodes.length; i += 1) {
              const item = nodes[i];
              if (isNode(item)) {
                if (!this.visit(item, node, key, i)) {
                  i--;
                }
              }
            }
          } else if (isNode(value)) {
            this.visit(value, node, key, null);
          }
        }
      }
      if (this.leave) {
        const _replacement = this.replacement;
        const _should_remove = this.should_remove;
        this.replacement = null;
        this.should_remove = false;
        this.leave.call(this.context, node, parent, prop, index);
        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }
        if (this.should_remove) {
          this.remove(parent, prop, index);
        }
        const removed = this.should_remove;
        this.replacement = _replacement;
        this.should_remove = _should_remove;
        if (removed)
          return null;
      }
    }
    return node;
  }
};
function isNode(value) {
  return value !== null && typeof value === "object" && "type" in value && typeof value.type === "string";
}

// ../../node_modules/.pnpm/estree-walker@3.0.3/node_modules/estree-walker/src/index.js
function walk(ast, { enter, leave }) {
  const instance = new SyncWalker(enter, leave);
  return instance.visit(ast, null);
}

// lib/rollup-plugin-unwind-css-module-class-name.ts
function isFalsyIdentifier(identifier) {
  return identifier.name === "undefined" || identifier.name === "NaN";
}
function normalizeClassWalker(tree, stack) {
  if (tree.type === "Identifier")
    return isFalsyIdentifier(tree) ? "" : null;
  if (tree.type === "Literal")
    return typeof tree.value === "string" ? tree.value : "";
  if (tree.type === "BinaryExpression") {
    if (tree.operator !== "+")
      return null;
    const left = normalizeClassWalker(tree.left, stack);
    const right = normalizeClassWalker(tree.right, stack);
    if (left === null || right === null)
      return null;
    return `${left}${right}`;
  }
  if (tree.type === "TemplateLiteral") {
    if (tree.expressions.some((x) => x.type !== "Literal" && (x.type !== "Identifier" || !isFalsyIdentifier(x))))
      return null;
    return tree.quasis.reduce((a, c, i) => {
      const v = i === tree.quasis.length - 1 ? "" : tree.expressions[i].value;
      return a + c.value.raw + (typeof v === "string" ? v : "");
    }, "");
  }
  if (tree.type === "ArrayExpression") {
    const values = tree.elements.map((treeNode) => {
      if (treeNode === null)
        return "";
      if (treeNode.type === "SpreadElement")
        return normalizeClassWalker(treeNode.argument, stack);
      return normalizeClassWalker(treeNode, stack);
    });
    if (values.some((x) => x === null))
      return null;
    return values.join(" ");
  }
  if (tree.type === "ObjectExpression") {
    const values = tree.properties.map((treeNode) => {
      if (treeNode.type === "SpreadElement")
        return normalizeClassWalker(treeNode.argument, stack);
      let x = treeNode.value;
      let inveted = false;
      while (x.type === "UnaryExpression" && x.operator === "!") {
        x = x.argument;
        inveted = !inveted;
      }
      if (x.type === "Literal") {
        if (inveted === !x.value) {
          return treeNode.key.type === "Identifier" ? treeNode.computed ? null : treeNode.key.name : treeNode.key.type === "Literal" ? treeNode.key.value : "";
        } else {
          return "";
        }
      }
      if (x.type === "Identifier") {
        if (inveted !== isFalsyIdentifier(x)) {
          return "";
        } else {
          return null;
        }
      }
      return null;
    });
    if (values.some((x) => x === null))
      return null;
    return values.join(" ");
  }
  if (tree.type !== "CallExpression" && tree.type !== "ChainExpression" && tree.type !== "ConditionalExpression" && tree.type !== "LogicalExpression" && tree.type !== "MemberExpression") {
    console.error(stack ? `Unexpected node type: ${tree.type} (in ${stack})` : `Unexpected node type: ${tree.type}`);
  }
  return null;
}
function normalizeClass(tree, stack) {
  const walked = normalizeClassWalker(tree, stack);
  return walked && walked.replace(/^\s+|\s+(?=\s)|\s+$/g, "");
}
function unwindCssModuleClassName(ast) {
  walk(ast, {
    enter(node, parent) {
      if (parent?.type !== "Program")
        return;
      if (node.type !== "VariableDeclaration")
        return;
      if (node.declarations.length !== 1)
        return;
      if (node.declarations[0].id.type !== "Identifier")
        return;
      const name = node.declarations[0].id.name;
      if (node.declarations[0].init?.type !== "CallExpression")
        return;
      if (node.declarations[0].init.callee.type !== "Identifier")
        return;
      if (node.declarations[0].init.callee.name !== "_export_sfc")
        return;
      if (node.declarations[0].init.arguments.length !== 2)
        return;
      if (node.declarations[0].init.arguments[0].type !== "Identifier")
        return;
      const ident = node.declarations[0].init.arguments[0].name;
      if (!ident.startsWith("_sfc_main"))
        return;
      if (node.declarations[0].init.arguments[1].type !== "ArrayExpression")
        return;
      if (node.declarations[0].init.arguments[1].elements.length === 0)
        return;
      const __cssModulesIndex = node.declarations[0].init.arguments[1].elements.findIndex((x) => {
        if (x?.type !== "ArrayExpression")
          return false;
        if (x.elements.length !== 2)
          return false;
        if (x.elements[0]?.type !== "Literal")
          return false;
        if (x.elements[0].value !== "__cssModules")
          return false;
        if (x.elements[1]?.type !== "Identifier")
          return false;
        return true;
      });
      if (!~__cssModulesIndex)
        return;
      const cssModuleForestName = node.declarations[0].init.arguments[1].elements[__cssModulesIndex].elements[1].name;
      const cssModuleForestNode = parent.body.find((x) => {
        if (x.type !== "VariableDeclaration")
          return false;
        if (x.declarations.length !== 1)
          return false;
        if (x.declarations[0].id.type !== "Identifier")
          return false;
        if (x.declarations[0].id.name !== cssModuleForestName)
          return false;
        if (x.declarations[0].init?.type !== "ObjectExpression")
          return false;
        return true;
      });
      const moduleForest = new Map(cssModuleForestNode.declarations[0].init.properties.flatMap((property) => {
        if (property.type !== "Property")
          return [];
        if (property.key.type !== "Literal")
          return [];
        if (property.value.type !== "Identifier")
          return [];
        return [[property.key.value, property.value.name]];
      }));
      const sfcMain = parent.body.find((x) => {
        if (x.type !== "VariableDeclaration")
          return false;
        if (x.declarations.length !== 1)
          return false;
        if (x.declarations[0].id.type !== "Identifier")
          return false;
        if (x.declarations[0].id.name !== ident)
          return false;
        return true;
      });
      if (sfcMain.declarations[0].init?.type !== "CallExpression")
        return;
      if (sfcMain.declarations[0].init.callee.type !== "Identifier")
        return;
      if (sfcMain.declarations[0].init.callee.name !== "defineComponent")
        return;
      if (sfcMain.declarations[0].init.arguments.length !== 1)
        return;
      if (sfcMain.declarations[0].init.arguments[0].type !== "ObjectExpression")
        return;
      const setup = sfcMain.declarations[0].init.arguments[0].properties.find((x) => {
        if (x.type !== "Property")
          return false;
        if (x.key.type !== "Identifier")
          return false;
        if (x.key.name !== "setup")
          return false;
        return true;
      });
      if (setup.value.type !== "FunctionExpression")
        return;
      const render = setup.value.body.body.find((x) => {
        if (x.type !== "ReturnStatement")
          return false;
        return true;
      });
      if (render.argument?.type !== "ArrowFunctionExpression")
        return;
      if (render.argument.params.length !== 2)
        return;
      const ctx = render.argument.params[0];
      if (ctx.type !== "Identifier")
        return;
      if (ctx.name !== "_ctx")
        return;
      if (render.argument.body.type !== "BlockStatement")
        return;
      for (const [key, value] of moduleForest) {
        const cssModuleTreeNode = parent.body.find((x) => {
          if (x.type !== "VariableDeclaration")
            return false;
          if (x.declarations.length !== 1)
            return false;
          if (x.declarations[0].id.type !== "Identifier")
            return false;
          if (x.declarations[0].id.name !== value)
            return false;
          return true;
        });
        if (cssModuleTreeNode.declarations[0].init?.type !== "ObjectExpression")
          return;
        const moduleTree = new Map(cssModuleTreeNode.declarations[0].init.properties.flatMap((property) => {
          if (property.type !== "Property")
            return [];
          const actualKey = property.key.type === "Identifier" ? property.key.name : property.key.type === "Literal" ? property.key.value : null;
          if (typeof actualKey !== "string")
            return [];
          if (property.value.type === "Literal")
            return [[actualKey, property.value.value]];
          if (property.value.type !== "Identifier")
            return [];
          const labelledValue = property.value.name;
          const actualValue = parent.body.find((x) => {
            if (x.type !== "VariableDeclaration")
              return false;
            if (x.declarations.length !== 1)
              return false;
            if (x.declarations[0].id.type !== "Identifier")
              return false;
            if (x.declarations[0].id.name !== labelledValue)
              return false;
            return true;
          });
          if (actualValue.declarations[0].init?.type !== "Literal")
            return [];
          return [[actualKey, actualValue.declarations[0].init.value]];
        }));
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "MemberExpression")
              return;
            if (childNode.object.type !== "MemberExpression")
              return;
            if (childNode.object.object.type !== "Identifier")
              return;
            if (childNode.object.object.name !== ctx.name)
              return;
            if (childNode.object.property.type !== "Identifier")
              return;
            if (childNode.object.property.name !== key)
              return;
            if (childNode.property.type !== "Identifier")
              return;
            const actualValue = moduleTree.get(childNode.property.name);
            if (actualValue === void 0)
              return;
            this.replace({
              type: "Literal",
              value: actualValue
            });
          }
        });
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "MemberExpression")
              return;
            if (childNode.object.type !== "MemberExpression")
              return;
            if (childNode.object.object.type !== "Identifier")
              return;
            if (childNode.object.object.name !== ctx.name)
              return;
            if (childNode.object.property.type !== "Identifier")
              return;
            if (childNode.object.property.name !== key)
              return;
            if (childNode.property.type !== "Identifier")
              return;
            console.error(`Undefined style detected: ${key}.${childNode.property.name} (in ${name})`);
            this.replace({
              type: "Identifier",
              name: "undefined"
            });
          }
        });
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "CallExpression")
              return;
            if (childNode.callee.type !== "Identifier")
              return;
            if (childNode.callee.name !== "normalizeClass")
              return;
            if (childNode.arguments.length !== 1)
              return;
            const normalized = normalizeClass(childNode.arguments[0], name);
            if (normalized === null)
              return;
            this.replace({
              type: "Literal",
              value: normalized
            });
          }
        });
      }
      if (node.declarations[0].init.arguments[1].elements.length === 1) {
        walk(ast, {
          enter(childNode) {
            if (childNode.type !== "Identifier")
              return;
            if (childNode.name !== ident)
              return;
            this.replace({
              type: "Identifier",
              name: node.declarations[0].id.name
            });
          }
        });
        this.remove();
      } else {
        this.replace({
          type: "VariableDeclaration",
          declarations: [{
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: node.declarations[0].id.name
            },
            init: {
              type: "CallExpression",
              callee: {
                type: "Identifier",
                name: "_export_sfc"
              },
              arguments: [{
                type: "Identifier",
                name: ident
              }, {
                type: "ArrayExpression",
                elements: node.declarations[0].init.arguments[1].elements.slice(0, __cssModulesIndex).concat(node.declarations[0].init.arguments[1].elements.slice(__cssModulesIndex + 1))
              }]
            }
          }],
          kind: "const"
        });
      }
    }
  });
}
function pluginUnwindCssModuleClassName() {
  return {
    name: "UnwindCssModuleClassName",
    renderChunk(code) {
      const ast = this.parse(code);
      unwindCssModuleClassName(ast);
      return { code: generate(ast) };
    }
  };
}

// vite.json5.ts
import JSON5 from "file:///home/misskey/core/node_modules/.pnpm/json5@2.2.3/node_modules/json5/lib/index.js";
import { createFilter, dataToEsm } from "file:///home/misskey/core/node_modules/.pnpm/@rollup+pluginutils@5.1.0_rollup@4.9.0/node_modules/@rollup/pluginutils/dist/es/index.js";
function json5(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = "indent" in options ? options.indent : "	";
  return {
    name: "json5",
    // eslint-disable-next-line no-shadow
    transform(json, id) {
      if (id.slice(-6) !== ".json5" || !filter(id))
        return null;
      try {
        const parsed = JSON5.parse(json);
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            indent
          }),
          map: { mappings: "" }
        };
      } catch (err) {
        if (!(err instanceof SyntaxError)) {
          throw err;
        }
        const message = "Could not parse JSON5 file";
        const { lineNumber, columnNumber } = err;
        this.warn({ message, id, loc: { line: lineNumber, column: columnNumber } });
        return null;
      }
    }
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "/home/misskey/core/packages/frontend";
var extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".json5", ".svg", ".sass", ".scss", ".css", ".vue"];
var hash = (str, seed = 0) => {
  let h1 = 3735928559 ^ seed, h2 = 1103547991 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
var BASE62_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function toBase62(n) {
  if (n === 0) {
    return "0";
  }
  let result = "";
  while (n > 0) {
    result = BASE62_DIGITS[n % BASE62_DIGITS.length] + result;
    n = Math.floor(n / BASE62_DIGITS.length);
  }
  return result;
}
function getConfig() {
  return {
    base: "/vite/",
    server: {
      port: 5173
    },
    plugins: [
      pluginVue(),
      pluginUnwindCssModuleClassName(),
      json5(),
      ...process.env.NODE_ENV === "production" ? [
        pluginReplace({
          preventAssignment: true,
          values: {
            "isChromatic()": JSON.stringify(false)
          }
        })
      ] : []
    ],
    resolve: {
      extensions,
      alias: {
        "@/": __vite_injected_original_dirname + "/src/",
        "/client-assets/": __vite_injected_original_dirname + "/assets/",
        "/static-assets/": __vite_injected_original_dirname + "/../backend/assets/",
        "/fluent-emojis/": __vite_injected_original_dirname + "/../../fluent-emojis/dist/",
        "/fluent-emoji/": __vite_injected_original_dirname + "/../../fluent-emojis/dist/"
      }
    },
    css: {
      modules: {
        generateScopedName(name, filename, _css) {
          const id = (path.relative(__vite_injected_original_dirname, filename.split("?")[0]) + "-" + name).replace(/[\\\/\.\?&=]/g, "-").replace(/(src-|vue-)/g, "");
          if (process.env.NODE_ENV === "production") {
            return "x" + toBase62(hash(id)).substring(0, 4);
          } else {
            return id;
          }
        }
      }
    },
    define: {
      _VERSION_: JSON.stringify(package_default.version),
      _LANGS_: JSON.stringify(Object.entries(locales_default).map(([k, v]) => [k, v._lang_])),
      _ENV_: JSON.stringify(process.env.NODE_ENV),
      _DEV_: process.env.NODE_ENV !== "production",
      _PERF_PREFIX_: JSON.stringify("Misskey:"),
      _DATA_TRANSFER_DRIVE_FILE_: JSON.stringify("mk_drive_file"),
      _DATA_TRANSFER_DRIVE_FOLDER_: JSON.stringify("mk_drive_folder"),
      _DATA_TRANSFER_DECK_COLUMN_: JSON.stringify("mk_deck_column"),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    },
    // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
    optimizeDeps: {
      include: ["misskey-js"]
    },
    build: {
      target: [
        "chrome116",
        "firefox116",
        "safari16"
      ],
      manifest: "manifest.json",
      rollupOptions: {
        input: {
          app: "./src/_boot_.ts"
        },
        output: {
          manualChunks: {
            vue: ["vue"],
            photoswipe: ["photoswipe", "photoswipe/lightbox", "photoswipe/style.css"]
          },
          chunkFileNames: process.env.NODE_ENV === "production" ? "[hash:8].js" : "[name]-[hash:8].js",
          assetFileNames: process.env.NODE_ENV === "production" ? "[hash:8][extname]" : "[name]-[hash:8][extname]"
        }
      },
      cssCodeSplit: true,
      outDir: __vite_injected_original_dirname + "/../../built/_vite_",
      assetsDir: ".",
      emptyOutDir: false,
      sourcemap: process.env.NODE_ENV === "development",
      reportCompressedSize: false,
      // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
      commonjsOptions: {
        include: [/misskey-js/, /node_modules/]
      }
    },
    worker: {
      format: "es"
    },
    test: {
      environment: "happy-dom",
      deps: {
        optimizer: {
          web: {
            include: [
              // XXX: misskey-dev/browser-image-resizer has no "type": "module"
              "browser-image-resizer"
            ]
          }
        }
      }
    }
  };
}
var config = defineConfig(({ command, mode }) => getConfig());
var vite_config_default = config;
export {
  vite_config_default as default,
  getConfig
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLi4vLi4vbG9jYWxlcy9pbmRleC5qcyIsICIuLi8uLi9wYWNrYWdlLmpzb24iLCAibGliL3JvbGx1cC1wbHVnaW4tdW53aW5kLWNzcy1tb2R1bGUtY2xhc3MtbmFtZS50cyIsICIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmMvd2Fsa2VyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9zeW5jLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9pbmRleC5qcyIsICJ2aXRlLmpzb241LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9taXNza2V5L2NvcmUvcGFja2FnZXMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcGx1Z2luUmVwbGFjZSBmcm9tICdAcm9sbHVwL3BsdWdpbi1yZXBsYWNlJztcbmltcG9ydCBwbHVnaW5WdWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCB7IHR5cGUgVXNlckNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmltcG9ydCBsb2NhbGVzIGZyb20gJy4uLy4uL2xvY2FsZXMnO1xuaW1wb3J0IG1ldGEgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBwbHVnaW5VbndpbmRDc3NNb2R1bGVDbGFzc05hbWUgZnJvbSAnLi9saWIvcm9sbHVwLXBsdWdpbi11bndpbmQtY3NzLW1vZHVsZS1jbGFzcy1uYW1lJztcbmltcG9ydCBwbHVnaW5Kc29uNSBmcm9tICcuL3ZpdGUuanNvbjUnO1xuXG5jb25zdCBleHRlbnNpb25zID0gWycudHMnLCAnLnRzeCcsICcuanMnLCAnLmpzeCcsICcubWpzJywgJy5qc29uJywgJy5qc29uNScsICcuc3ZnJywgJy5zYXNzJywgJy5zY3NzJywgJy5jc3MnLCAnLnZ1ZSddO1xuXG5jb25zdCBoYXNoID0gKHN0cjogc3RyaW5nLCBzZWVkID0gMCk6IG51bWJlciA9PiB7XG5cdGxldCBoMSA9IDB4ZGVhZGJlZWYgXiBzZWVkLFxuXHRcdGgyID0gMHg0MWM2Y2U1NyBeIHNlZWQ7XG5cdGZvciAobGV0IGkgPSAwLCBjaDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuXHRcdGNoID0gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdFx0aDEgPSBNYXRoLmltdWwoaDEgXiBjaCwgMjY1NDQzNTc2MSk7XG5cdFx0aDIgPSBNYXRoLmltdWwoaDIgXiBjaCwgMTU5NzMzNDY3Nyk7XG5cdH1cblxuXHRoMSA9IE1hdGguaW11bChoMSBeIChoMSA+Pj4gMTYpLCAyMjQ2ODIyNTA3KSBeIE1hdGguaW11bChoMiBeIChoMiA+Pj4gMTMpLCAzMjY2NDg5OTA5KTtcblx0aDIgPSBNYXRoLmltdWwoaDIgXiAoaDIgPj4+IDE2KSwgMjI0NjgyMjUwNykgXiBNYXRoLmltdWwoaDEgXiAoaDEgPj4+IDEzKSwgMzI2NjQ4OTkwOSk7XG5cblx0cmV0dXJuIDQyOTQ5NjcyOTYgKiAoMjA5NzE1MSAmIGgyKSArIChoMSA+Pj4gMCk7XG59O1xuXG5jb25zdCBCQVNFNjJfRElHSVRTID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcbmZ1bmN0aW9uIHRvQmFzZTYyKG46IG51bWJlcik6IHN0cmluZyB7XG5cdGlmIChuID09PSAwKSB7XG5cdFx0cmV0dXJuICcwJztcblx0fVxuXHRsZXQgcmVzdWx0ID0gJyc7XG5cdHdoaWxlIChuID4gMCkge1xuXHRcdHJlc3VsdCA9IEJBU0U2Ml9ESUdJVFNbbiAlIEJBU0U2Ml9ESUdJVFMubGVuZ3RoXSArIHJlc3VsdDtcblx0XHRuID0gTWF0aC5mbG9vcihuIC8gQkFTRTYyX0RJR0lUUy5sZW5ndGgpO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZygpOiBVc2VyQ29uZmlnIHtcblx0cmV0dXJuIHtcblx0XHRiYXNlOiAnL3ZpdGUvJyxcblxuXHRcdHNlcnZlcjoge1xuXHRcdFx0cG9ydDogNTE3Myxcblx0XHR9LFxuXG5cdFx0cGx1Z2luczogW1xuXHRcdFx0cGx1Z2luVnVlKCksXG5cdFx0XHRwbHVnaW5VbndpbmRDc3NNb2R1bGVDbGFzc05hbWUoKSxcblx0XHRcdHBsdWdpbkpzb241KCksXG5cdFx0XHQuLi5wcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nXG5cdFx0XHRcdD8gW1xuXHRcdFx0XHRcdHBsdWdpblJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0cHJldmVudEFzc2lnbm1lbnQ6IHRydWUsXG5cdFx0XHRcdFx0XHR2YWx1ZXM6IHtcblx0XHRcdFx0XHRcdFx0J2lzQ2hyb21hdGljKCknOiBKU09OLnN0cmluZ2lmeShmYWxzZSksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdXG5cdFx0XHRcdDogW10sXG5cdFx0XSxcblxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGV4dGVuc2lvbnMsXG5cdFx0XHRhbGlhczoge1xuXHRcdFx0XHQnQC8nOiBfX2Rpcm5hbWUgKyAnL3NyYy8nLFxuXHRcdFx0XHQnL2NsaWVudC1hc3NldHMvJzogX19kaXJuYW1lICsgJy9hc3NldHMvJyxcblx0XHRcdFx0Jy9zdGF0aWMtYXNzZXRzLyc6IF9fZGlybmFtZSArICcvLi4vYmFja2VuZC9hc3NldHMvJyxcblx0XHRcdFx0Jy9mbHVlbnQtZW1vamlzLyc6IF9fZGlybmFtZSArICcvLi4vLi4vZmx1ZW50LWVtb2ppcy9kaXN0LycsXG5cdFx0XHRcdCcvZmx1ZW50LWVtb2ppLyc6IF9fZGlybmFtZSArICcvLi4vLi4vZmx1ZW50LWVtb2ppcy9kaXN0LycsXG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRjc3M6IHtcblx0XHRcdG1vZHVsZXM6IHtcblx0XHRcdFx0Z2VuZXJhdGVTY29wZWROYW1lKG5hbWUsIGZpbGVuYW1lLCBfY3NzKTogc3RyaW5nIHtcblx0XHRcdFx0XHRjb25zdCBpZCA9IChwYXRoLnJlbGF0aXZlKF9fZGlybmFtZSwgZmlsZW5hbWUuc3BsaXQoJz8nKVswXSkgKyAnLScgKyBuYW1lKS5yZXBsYWNlKC9bXFxcXFxcL1xcLlxcPyY9XS9nLCAnLScpLnJlcGxhY2UoLyhzcmMtfHZ1ZS0pL2csICcnKTtcblx0XHRcdFx0XHRpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICd4JyArIHRvQmFzZTYyKGhhc2goaWQpKS5zdWJzdHJpbmcoMCwgNCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBpZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRkZWZpbmU6IHtcblx0XHRcdF9WRVJTSU9OXzogSlNPTi5zdHJpbmdpZnkobWV0YS52ZXJzaW9uKSxcblx0XHRcdF9MQU5HU186IEpTT04uc3RyaW5naWZ5KE9iamVjdC5lbnRyaWVzKGxvY2FsZXMpLm1hcCgoW2ssIHZdKSA9PiBbaywgdi5fbGFuZ19dKSksXG5cdFx0XHRfRU5WXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYpLFxuXHRcdFx0X0RFVl86IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicsXG5cdFx0XHRfUEVSRl9QUkVGSVhfOiBKU09OLnN0cmluZ2lmeSgnTWlzc2tleTonKSxcblx0XHRcdF9EQVRBX1RSQU5TRkVSX0RSSVZFX0ZJTEVfOiBKU09OLnN0cmluZ2lmeSgnbWtfZHJpdmVfZmlsZScpLFxuXHRcdFx0X0RBVEFfVFJBTlNGRVJfRFJJVkVfRk9MREVSXzogSlNPTi5zdHJpbmdpZnkoJ21rX2RyaXZlX2ZvbGRlcicpLFxuXHRcdFx0X0RBVEFfVFJBTlNGRVJfREVDS19DT0xVTU5fOiBKU09OLnN0cmluZ2lmeSgnbWtfZGVja19jb2x1bW4nKSxcblx0XHRcdF9fVlVFX09QVElPTlNfQVBJX186IHRydWUsXG5cdFx0XHRfX1ZVRV9QUk9EX0RFVlRPT0xTX186IGZhbHNlLFxuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL3ZpdGVqcy5kZXYvZ3VpZGUvZGVwLXByZS1idW5kbGluZy5odG1sI21vbm9yZXBvcy1hbmQtbGlua2VkLWRlcGVuZGVuY2llc1xuXHRcdG9wdGltaXplRGVwczoge1xuXHRcdFx0aW5jbHVkZTogWydtaXNza2V5LWpzJ10sXG5cdFx0fSxcblxuXHRcdGJ1aWxkOiB7XG5cdFx0XHR0YXJnZXQ6IFtcblx0XHRcdFx0J2Nocm9tZTExNicsXG5cdFx0XHRcdCdmaXJlZm94MTE2Jyxcblx0XHRcdFx0J3NhZmFyaTE2Jyxcblx0XHRcdF0sXG5cdFx0XHRtYW5pZmVzdDogJ21hbmlmZXN0Lmpzb24nLFxuXHRcdFx0cm9sbHVwT3B0aW9uczoge1xuXHRcdFx0XHRpbnB1dDoge1xuXHRcdFx0XHRcdGFwcDogJy4vc3JjL19ib290Xy50cycsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHRcdG1hbnVhbENodW5rczoge1xuXHRcdFx0XHRcdFx0dnVlOiBbJ3Z1ZSddLFxuXHRcdFx0XHRcdFx0cGhvdG9zd2lwZTogWydwaG90b3N3aXBlJywgJ3Bob3Rvc3dpcGUvbGlnaHRib3gnLCAncGhvdG9zd2lwZS9zdHlsZS5jc3MnXSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNodW5rRmlsZU5hbWVzOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJ1toYXNoOjhdLmpzJyA6ICdbbmFtZV0tW2hhc2g6OF0uanMnLFxuXHRcdFx0XHRcdGFzc2V0RmlsZU5hbWVzOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJ1toYXNoOjhdW2V4dG5hbWVdJyA6ICdbbmFtZV0tW2hhc2g6OF1bZXh0bmFtZV0nLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdGNzc0NvZGVTcGxpdDogdHJ1ZSxcblx0XHRcdG91dERpcjogX19kaXJuYW1lICsgJy8uLi8uLi9idWlsdC9fdml0ZV8nLFxuXHRcdFx0YXNzZXRzRGlyOiAnLicsXG5cdFx0XHRlbXB0eU91dERpcjogZmFsc2UsXG5cdFx0XHRzb3VyY2VtYXA6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxuXHRcdFx0cmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuXG5cdFx0XHQvLyBodHRwczovL3ZpdGVqcy5kZXYvZ3VpZGUvZGVwLXByZS1idW5kbGluZy5odG1sI21vbm9yZXBvcy1hbmQtbGlua2VkLWRlcGVuZGVuY2llc1xuXHRcdFx0Y29tbW9uanNPcHRpb25zOiB7XG5cdFx0XHRcdGluY2x1ZGU6IFsvbWlzc2tleS1qcy8sIC9ub2RlX21vZHVsZXMvXSxcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdHdvcmtlcjoge1xuXHRcdFx0Zm9ybWF0OiAnZXMnLFxuXHRcdH0sXG5cblx0XHR0ZXN0OiB7XG5cdFx0XHRlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXG5cdFx0XHRkZXBzOiB7XG5cdFx0XHRcdG9wdGltaXplcjoge1xuXHRcdFx0XHRcdHdlYjoge1xuXHRcdFx0XHRcdFx0aW5jbHVkZTogW1xuXHRcdFx0XHRcdFx0XHQvLyBYWFg6IG1pc3NrZXktZGV2L2Jyb3dzZXItaW1hZ2UtcmVzaXplciBoYXMgbm8gXCJ0eXBlXCI6IFwibW9kdWxlXCJcblx0XHRcdFx0XHRcdFx0J2Jyb3dzZXItaW1hZ2UtcmVzaXplcicsXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH07XG59XG5cbmNvbnN0IGNvbmZpZyA9IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IGdldENvbmZpZygpKTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9taXNza2V5L2NvcmUvbG9jYWxlc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL2xvY2FsZXMvaW5kZXguanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbWlzc2tleS9jb3JlL2xvY2FsZXMvaW5kZXguanNcIjsvKipcbiAqIExhbmd1YWdlcyBMb2FkZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHlhbWwgZnJvbSAnanMteWFtbCc7XG5cbmNvbnN0IG1lcmdlID0gKC4uLmFyZ3MpID0+IGFyZ3MucmVkdWNlKChhLCBjKSA9PiAoe1xuXHQuLi5hLFxuXHQuLi5jLFxuXHQuLi5PYmplY3QuZW50cmllcyhhKVxuXHRcdC5maWx0ZXIoKFtrXSkgPT4gYyAmJiB0eXBlb2YgY1trXSA9PT0gJ29iamVjdCcpXG5cdFx0LnJlZHVjZSgoYSwgW2ssIHZdKSA9PiAoYVtrXSA9IG1lcmdlKHYsIGNba10pLCBhKSwge30pXG59KSwge30pO1xuXG5jb25zdCBsYW5ndWFnZXMgPSBbXG5cdCdhci1TQScsXG5cdCdjcy1DWicsXG5cdCdkYS1ESycsXG5cdCdkZS1ERScsXG5cdCdlbi1VUycsXG5cdCdlcy1FUycsXG5cdCdmci1GUicsXG5cdCdpZC1JRCcsXG5cdCdpdC1JVCcsXG5cdCdqYS1KUCcsXG5cdCdqYS1LUycsXG5cdCdrYWItS0FCJyxcblx0J2tuLUlOJyxcblx0J2tvLUtSJyxcblx0J25sLU5MJyxcblx0J25vLU5PJyxcblx0J3BsLVBMJyxcblx0J3B0LVBUJyxcblx0J3J1LVJVJyxcblx0J3NrLVNLJyxcblx0J3RoLVRIJyxcblx0J3VnLUNOJyxcblx0J3VrLVVBJyxcblx0J3ZpLVZOJyxcblx0J3poLUNOJyxcblx0J3poLVRXJyxcbl07XG5cbmNvbnN0IHByaW1hcmllcyA9IHtcblx0J2VuJzogJ1VTJyxcblx0J2phJzogJ0pQJyxcblx0J3poJzogJ0NOJyxcbn07XG5cbi8vIFx1NEY1NVx1NjU0NVx1MzA0Qlx1NjU4N1x1NUI1N1x1NTIxN1x1MzA2Qlx1MzBEMFx1MzBDM1x1MzBBRlx1MzBCOVx1MzBEQVx1MzBGQ1x1MzBCOVx1NjU4N1x1NUI1N1x1MzA0Q1x1NkRGN1x1NTE2NVx1MzA1OVx1MzA4Qlx1MzA1M1x1MzA2OFx1MzA0Q1x1MzA0Mlx1MzA4QVx1MzAwMVlBTUxcdTMwNENcdTU4Q0FcdTMwOENcdTMwOEJcdTMwNkVcdTMwNjdcdTUzRDZcdTMwOEFcdTk2NjRcdTMwNEZcbmNvbnN0IGNsZWFuID0gKHRleHQpID0+IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKFN0cmluZy5mcm9tQ29kZVBvaW50KDB4MDgpLCAnZycpLCAnJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZCgpIHtcblx0Y29uc3QgbG9jYWxlcyA9IGxhbmd1YWdlcy5yZWR1Y2UoKGEsIGMpID0+IChhW2NdID0geWFtbC5sb2FkKGNsZWFuKGZzLnJlYWRGaWxlU3luYyhuZXcgVVJMKGAke2N9LnltbGAsIGltcG9ydC5tZXRhLnVybCksICd1dGYtOCcpKSkgfHwge30sIGEpLCB7fSk7XG5cblx0Ly8gXHU3QTdBXHU2NTg3XHU1QjU3XHU1MjE3XHUzMDRDXHU1MTY1XHUzMDhCXHUzMDUzXHUzMDY4XHUzMDRDXHUzMDQyXHUzMDhBXHUzMDAxXHUzMEQ1XHUzMEE5XHUzMEZDXHUzMEVCXHUzMEQwXHUzMEMzXHUzMEFGXHUzMDRDXHU1MkQ1XHU0RjVDXHUzMDU3XHUzMDZBXHUzMDRGXHUzMDZBXHUzMDhCXHUzMDZFXHUzMDY3XHUzMEQ3XHUzMEVEXHUzMEQxXHUzMEM2XHUzMEEzXHUzMDU0XHUzMDY4XHU2RDg4XHUzMDU5XG5cdGNvbnN0IHJlbW92ZUVtcHR5ID0gKG9iaikgPT4ge1xuXHRcdGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHtcblx0XHRcdGlmICh2ID09PSAnJykge1xuXHRcdFx0XHRkZWxldGUgb2JqW2tdO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0cmVtb3ZlRW1wdHkodik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cdHJlbW92ZUVtcHR5KGxvY2FsZXMpO1xuXG5cdHJldHVybiBPYmplY3QuZW50cmllcyhsb2NhbGVzKVxuXHRcdC5yZWR1Y2UoKGEsIFtrLCB2XSkgPT4gKGFba10gPSAoKCkgPT4ge1xuXHRcdFx0Y29uc3QgW2xhbmddID0gay5zcGxpdCgnLScpO1xuXHRcdFx0c3dpdGNoIChrKSB7XG5cdFx0XHRcdGNhc2UgJ2phLUpQJzogcmV0dXJuIHY7XG5cdFx0XHRcdGNhc2UgJ2phLUtTJzpcblx0XHRcdFx0Y2FzZSAnZW4tVVMnOiByZXR1cm4gbWVyZ2UobG9jYWxlc1snamEtSlAnXSwgdik7XG5cdFx0XHRcdGRlZmF1bHQ6IHJldHVybiBtZXJnZShcblx0XHRcdFx0XHRsb2NhbGVzWydqYS1KUCddLFxuXHRcdFx0XHRcdGxvY2FsZXNbJ2VuLVVTJ10sXG5cdFx0XHRcdFx0bG9jYWxlc1tgJHtsYW5nfS0ke3ByaW1hcmllc1tsYW5nXX1gXSA/PyB7fSxcblx0XHRcdFx0XHR2XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fSkoKSwgYSksIHt9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYnVpbGQoKTtcbiIsICJ7XG5cdFwibmFtZVwiOiBcIm1pc3NrZXlcIixcblx0XCJ2ZXJzaW9uXCI6IFwiMjAyMy4xMi4wLWJldGEuNS5wYXBpXCIsXG5cdFwiY29kZW5hbWVcIjogXCJuYXN1YmlcIixcblx0XCJyZXBvc2l0b3J5XCI6IHtcblx0XHRcInR5cGVcIjogXCJnaXRcIixcblx0XHRcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9uMWxzcW4vbWlzc2tleS5naXRcIlxuXHR9LFxuXHRcInBhY2thZ2VNYW5hZ2VyXCI6IFwicG5wbUA4LjEyLjFcIixcblx0XCJ3b3Jrc3BhY2VzXCI6IFtcblx0XHRcInBhY2thZ2VzL2Zyb250ZW5kXCIsXG5cdFx0XCJwYWNrYWdlcy9iYWNrZW5kXCIsXG5cdFx0XCJwYWNrYWdlcy9zd1wiXG5cdF0sXG5cdFwicHJpdmF0ZVwiOiB0cnVlLFxuXHRcInNjcmlwdHNcIjoge1xuXHRcdFwiYnVpbGQtcHJlXCI6IFwibm9kZSAuL3NjcmlwdHMvYnVpbGQtcHJlLmpzXCIsXG5cdFx0XCJidWlsZC1hc3NldHNcIjogXCJub2RlIC4vc2NyaXB0cy9idWlsZC1hc3NldHMubWpzXCIsXG5cdFx0XCJidWlsZFwiOiBcInBucG0gYnVpbGQtcHJlICYmIHBucG0gLXIgYnVpbGQgJiYgcG5wbSBidWlsZC1hc3NldHNcIixcblx0XHRcImJ1aWxkLXN0b3J5Ym9va1wiOiBcInBucG0gLS1maWx0ZXIgZnJvbnRlbmQgYnVpbGQtc3Rvcnlib29rXCIsXG5cdFx0XCJidWlsZC1taXNza2V5LWpzLXdpdGgtdHlwZXNcIjogXCJwbnBtIC0tZmlsdGVyIGJhY2tlbmQgYnVpbGQgJiYgcG5wbSAtLWZpbHRlciBiYWNrZW5kIGdlbmVyYXRlLWFwaS1qc29uICYmIG5jcCBwYWNrYWdlcy9iYWNrZW5kL2J1aWx0L2FwaS5qc29uIHBhY2thZ2VzL21pc3NrZXktanMvZ2VuZXJhdG9yL2FwaS5qc29uICYmIHBucG0gLS1maWx0ZXIgbWlzc2tleS1qcyB1cGRhdGUtYXV0b2dlbi1jb2RlICYmIHBucG0gLS1maWx0ZXIgbWlzc2tleS1qcyBidWlsZFwiLFxuXHRcdFwic3RhcnRcIjogXCJwbnBtIGNoZWNrOmNvbm5lY3QgJiYgY2QgcGFja2FnZXMvYmFja2VuZCAmJiBub2RlIC4vYnVpbHQvYm9vdC9lbnRyeS5qc1wiLFxuXHRcdFwic3RhcnQ6dGVzdFwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgY3Jvc3MtZW52IE5PREVfRU5WPXRlc3Qgbm9kZSAuL2J1aWx0L2Jvb3QvZW50cnkuanNcIixcblx0XHRcImluaXRcIjogXCJwbnBtIG1pZ3JhdGVcIixcblx0XHRcIm1pZ3JhdGVcIjogXCJjZCBwYWNrYWdlcy9iYWNrZW5kICYmIHBucG0gbWlncmF0ZVwiLFxuXHRcdFwicmV2ZXJ0XCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBwbnBtIHJldmVydFwiLFxuXHRcdFwiY2hlY2s6Y29ubmVjdFwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgcG5wbSBjaGVjazpjb25uZWN0XCIsXG5cdFx0XCJtaWdyYXRlYW5kc3RhcnRcIjogXCJwbnBtIG1pZ3JhdGUgJiYgcG5wbSBzdGFydFwiLFxuXHRcdFwid2F0Y2hcIjogXCJwbnBtIGRldlwiLFxuXHRcdFwiZGV2XCI6IFwibm9kZSBzY3JpcHRzL2Rldi5tanNcIixcblx0XHRcImxpbnRcIjogXCJwbnBtIC1yIGxpbnRcIixcblx0XHRcImN5Om9wZW5cIjogXCJwbnBtIGN5cHJlc3Mgb3BlbiAtLWJyb3dzZXIgLS1lMmUgLS1jb25maWctZmlsZT1jeXByZXNzLmNvbmZpZy50c1wiLFxuXHRcdFwiY3k6cnVuXCI6IFwicG5wbSBjeXByZXNzIHJ1blwiLFxuXHRcdFwiZTJlXCI6IFwicG5wbSBzdGFydC1zZXJ2ZXItYW5kLXRlc3Qgc3RhcnQ6dGVzdCBodHRwOi8vbG9jYWxob3N0OjYxODEyIGN5OnJ1blwiLFxuXHRcdFwiamVzdFwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgcG5wbSBqZXN0XCIsXG5cdFx0XCJqZXN0LWFuZC1jb3ZlcmFnZVwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgcG5wbSBqZXN0LWFuZC1jb3ZlcmFnZVwiLFxuXHRcdFwidGVzdFwiOiBcInBucG0gLXIgdGVzdFwiLFxuXHRcdFwidGVzdC1hbmQtY292ZXJhZ2VcIjogXCJwbnBtIC1yIHRlc3QtYW5kLWNvdmVyYWdlXCIsXG5cdFx0XCJjbGVhblwiOiBcIm5vZGUgLi9zY3JpcHRzL2NsZWFuLmpzXCIsXG5cdFx0XCJjbGVhbi1hbGxcIjogXCJub2RlIC4vc2NyaXB0cy9jbGVhbi1hbGwuanNcIixcblx0XHRcImNsZWFuYWxsXCI6IFwicG5wbSBjbGVhbi1hbGxcIlxuXHR9LFxuXHRcInJlc29sdXRpb25zXCI6IHtcblx0XHRcImNob2tpZGFyXCI6IFwiMy41LjNcIixcblx0XHRcImxvZGFzaFwiOiBcIjQuMTcuMjFcIlxuXHR9LFxuXHRcImRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJjc3NuYW5vXCI6IFwiNi4wLjFcIixcblx0XHRcImV4ZWNhXCI6IFwiOC4wLjFcIixcblx0XHRcImpzLXlhbWxcIjogXCI0LjEuMFwiLFxuXHRcdFwia2F0ZXhcIjogXCIwLjE2LjhcIixcblx0XHRcInBvc3Rjc3NcIjogXCI4LjQuMzJcIixcblx0XHRcInRlcnNlclwiOiBcIjUuMjYuMFwiLFxuXHRcdFwidHlwZXNjcmlwdFwiOiBcIjUuMy4zXCJcblx0fSxcblx0XCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuXHRcdFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCI2LjE0LjBcIixcblx0XHRcIkB0eXBlc2NyaXB0LWVzbGludC9wYXJzZXJcIjogXCI2LjE0LjBcIixcblx0XHRcImNyb3NzLWVudlwiOiBcIjcuMC4zXCIsXG5cdFx0XCJjeXByZXNzXCI6IFwiMTMuNi4xXCIsXG5cdFx0XCJlc2xpbnRcIjogXCI4LjU2LjBcIixcblx0XHRcIm5jcFwiOiBcIjIuMC4wXCIsXG5cdFx0XCJub2RlbW9uXCI6IFwiMy4wLjJcIixcblx0XHRcInN0YXJ0LXNlcnZlci1hbmQtdGVzdFwiOiBcIjIuMC4zXCJcblx0fSxcblx0XCJvcHRpb25hbERlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAdGVuc29yZmxvdy90ZmpzLWNvcmVcIjogXCI0LjQuMFwiXG5cdH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL2xpYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL2xpYi9yb2xsdXAtcGx1Z2luLXVud2luZC1jc3MtbW9kdWxlLWNsYXNzLW5hbWUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL2xpYi9yb2xsdXAtcGx1Z2luLXVud2luZC1jc3MtbW9kdWxlLWNsYXNzLW5hbWUudHNcIjsvKlxuICogU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogc3l1aWxvIGFuZCBvdGhlciBtaXNza2V5IGNvbnRyaWJ1dG9yc1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9ubHlcbiAqL1xuXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ2FzdHJpbmcnO1xuaW1wb3J0ICogYXMgZXN0cmVlIGZyb20gJ2VzdHJlZSc7XG5pbXBvcnQgeyB3YWxrIH0gZnJvbSAnLi4vbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL2luZGV4LmpzJztcbmltcG9ydCB0eXBlICogYXMgZXN0cmVlV2Fsa2VyIGZyb20gJ2VzdHJlZS13YWxrZXInO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJztcblxuZnVuY3Rpb24gaXNGYWxzeUlkZW50aWZpZXIoaWRlbnRpZmllcjogZXN0cmVlLklkZW50aWZpZXIpOiBib29sZWFuIHtcblx0cmV0dXJuIGlkZW50aWZpZXIubmFtZSA9PT0gJ3VuZGVmaW5lZCcgfHwgaWRlbnRpZmllci5uYW1lID09PSAnTmFOJztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3NXYWxrZXIodHJlZTogZXN0cmVlLk5vZGUsIHN0YWNrOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcblx0aWYgKHRyZWUudHlwZSA9PT0gJ0lkZW50aWZpZXInKSByZXR1cm4gaXNGYWxzeUlkZW50aWZpZXIodHJlZSkgPyAnJyA6IG51bGw7XG5cdGlmICh0cmVlLnR5cGUgPT09ICdMaXRlcmFsJykgcmV0dXJuIHR5cGVvZiB0cmVlLnZhbHVlID09PSAnc3RyaW5nJyA/IHRyZWUudmFsdWUgOiAnJztcblx0aWYgKHRyZWUudHlwZSA9PT0gJ0JpbmFyeUV4cHJlc3Npb24nKSB7XG5cdFx0aWYgKHRyZWUub3BlcmF0b3IgIT09ICcrJykgcmV0dXJuIG51bGw7XG5cdFx0Y29uc3QgbGVmdCA9IG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWUubGVmdCwgc3RhY2spO1xuXHRcdGNvbnN0IHJpZ2h0ID0gbm9ybWFsaXplQ2xhc3NXYWxrZXIodHJlZS5yaWdodCwgc3RhY2spO1xuXHRcdGlmIChsZWZ0ID09PSBudWxsIHx8IHJpZ2h0ID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0XHRyZXR1cm4gYCR7bGVmdH0ke3JpZ2h0fWA7XG5cdH1cblx0aWYgKHRyZWUudHlwZSA9PT0gJ1RlbXBsYXRlTGl0ZXJhbCcpIHtcblx0XHRpZiAodHJlZS5leHByZXNzaW9ucy5zb21lKCh4KSA9PiB4LnR5cGUgIT09ICdMaXRlcmFsJyAmJiAoeC50eXBlICE9PSAnSWRlbnRpZmllcicgfHwgIWlzRmFsc3lJZGVudGlmaWVyKHgpKSkpIHJldHVybiBudWxsO1xuXHRcdHJldHVybiB0cmVlLnF1YXNpcy5yZWR1Y2UoKGEsIGMsIGkpID0+IHtcblx0XHRcdGNvbnN0IHYgPSBpID09PSB0cmVlLnF1YXNpcy5sZW5ndGggLSAxID8gJycgOiAodHJlZS5leHByZXNzaW9uc1tpXSBhcyBQYXJ0aWFsPGVzdHJlZS5MaXRlcmFsPikudmFsdWU7XG5cdFx0XHRyZXR1cm4gYSArIGMudmFsdWUucmF3ICsgKHR5cGVvZiB2ID09PSAnc3RyaW5nJyA/IHYgOiAnJyk7XG5cdFx0fSwgJycpO1xuXHR9XG5cdGlmICh0cmVlLnR5cGUgPT09ICdBcnJheUV4cHJlc3Npb24nKSB7XG5cdFx0Y29uc3QgdmFsdWVzID0gdHJlZS5lbGVtZW50cy5tYXAoKHRyZWVOb2RlKSA9PiB7XG5cdFx0XHRpZiAodHJlZU5vZGUgPT09IG51bGwpIHJldHVybiAnJztcblx0XHRcdGlmICh0cmVlTm9kZS50eXBlID09PSAnU3ByZWFkRWxlbWVudCcpIHJldHVybiBub3JtYWxpemVDbGFzc1dhbGtlcih0cmVlTm9kZS5hcmd1bWVudCwgc3RhY2spO1xuXHRcdFx0cmV0dXJuIG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWVOb2RlLCBzdGFjayk7XG5cdFx0fSk7XG5cdFx0aWYgKHZhbHVlcy5zb21lKCh4KSA9PiB4ID09PSBudWxsKSkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIHZhbHVlcy5qb2luKCcgJyk7XG5cdH1cblx0aWYgKHRyZWUudHlwZSA9PT0gJ09iamVjdEV4cHJlc3Npb24nKSB7XG5cdFx0Y29uc3QgdmFsdWVzID0gdHJlZS5wcm9wZXJ0aWVzLm1hcCgodHJlZU5vZGUpID0+IHtcblx0XHRcdGlmICh0cmVlTm9kZS50eXBlID09PSAnU3ByZWFkRWxlbWVudCcpIHJldHVybiBub3JtYWxpemVDbGFzc1dhbGtlcih0cmVlTm9kZS5hcmd1bWVudCwgc3RhY2spO1xuXHRcdFx0bGV0IHggPSB0cmVlTm9kZS52YWx1ZTtcblx0XHRcdGxldCBpbnZldGVkID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAoeC50eXBlID09PSAnVW5hcnlFeHByZXNzaW9uJyAmJiB4Lm9wZXJhdG9yID09PSAnIScpIHtcblx0XHRcdFx0eCA9IHguYXJndW1lbnQ7XG5cdFx0XHRcdGludmV0ZWQgPSAhaW52ZXRlZDtcblx0XHRcdH1cblx0XHRcdGlmICh4LnR5cGUgPT09ICdMaXRlcmFsJykge1xuXHRcdFx0XHRpZiAoaW52ZXRlZCA9PT0gIXgudmFsdWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJlZU5vZGUua2V5LnR5cGUgPT09ICdJZGVudGlmaWVyJyA/IHRyZWVOb2RlLmNvbXB1dGVkID8gbnVsbCA6IHRyZWVOb2RlLmtleS5uYW1lIDogdHJlZU5vZGUua2V5LnR5cGUgPT09ICdMaXRlcmFsJyA/IHRyZWVOb2RlLmtleS52YWx1ZSA6ICcnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKHgudHlwZSA9PT0gJ0lkZW50aWZpZXInKSB7XG5cdFx0XHRcdGlmIChpbnZldGVkICE9PSBpc0ZhbHN5SWRlbnRpZmllcih4KSkge1xuXHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSk7XG5cdFx0aWYgKHZhbHVlcy5zb21lKCh4KSA9PiB4ID09PSBudWxsKSkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIHZhbHVlcy5qb2luKCcgJyk7XG5cdH1cblx0aWYgKFxuXHRcdHRyZWUudHlwZSAhPT0gJ0NhbGxFeHByZXNzaW9uJyAmJlxuXHRcdHRyZWUudHlwZSAhPT0gJ0NoYWluRXhwcmVzc2lvbicgJiZcblx0XHR0cmVlLnR5cGUgIT09ICdDb25kaXRpb25hbEV4cHJlc3Npb24nICYmXG5cdFx0dHJlZS50eXBlICE9PSAnTG9naWNhbEV4cHJlc3Npb24nICYmXG5cdFx0dHJlZS50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcblx0XHRjb25zb2xlLmVycm9yKHN0YWNrID8gYFVuZXhwZWN0ZWQgbm9kZSB0eXBlOiAke3RyZWUudHlwZX0gKGluICR7c3RhY2t9KWAgOiBgVW5leHBlY3RlZCBub2RlIHR5cGU6ICR7dHJlZS50eXBlfWApO1xuXHR9XG5cdHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3ModHJlZTogZXN0cmVlLk5vZGUsIHN0YWNrPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG5cdGNvbnN0IHdhbGtlZCA9IG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWUsIHN0YWNrKTtcblx0cmV0dXJuIHdhbGtlZCAmJiB3YWxrZWQucmVwbGFjZSgvXlxccyt8XFxzKyg/PVxccyl8XFxzKyQvZywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53aW5kQ3NzTW9kdWxlQ2xhc3NOYW1lKGFzdDogZXN0cmVlLk5vZGUpOiB2b2lkIHtcblx0KHdhbGsgYXMgdHlwZW9mIGVzdHJlZVdhbGtlci53YWxrKShhc3QsIHtcblx0XHRlbnRlcihub2RlLCBwYXJlbnQpOiB2b2lkIHtcblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0aWYgKHBhcmVudD8udHlwZSAhPT0gJ1Byb2dyYW0nKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGNvbnN0IG5hbWUgPSBub2RlLmRlY2xhcmF0aW9uc1swXS5pZC5uYW1lO1xuXHRcdFx0aWYgKG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQ/LnR5cGUgIT09ICdDYWxsRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS5uYW1lICE9PSAnX2V4cG9ydF9zZmMnKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHMubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMF0udHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRjb25zdCBpZGVudCA9IG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzBdLm5hbWU7XG5cdFx0XHRpZiAoIWlkZW50LnN0YXJ0c1dpdGgoJ19zZmNfbWFpbicpKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0udHlwZSAhPT0gJ0FycmF5RXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1sxXS5lbGVtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcblx0XHRcdGNvbnN0IF9fY3NzTW9kdWxlc0luZGV4ID0gbm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHMuZmluZEluZGV4KCh4KSA9PiB7XG5cdFx0XHRcdGlmICh4Py50eXBlICE9PSAnQXJyYXlFeHByZXNzaW9uJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5lbGVtZW50cy5sZW5ndGggIT09IDIpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZWxlbWVudHNbMF0/LnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5lbGVtZW50c1swXS52YWx1ZSAhPT0gJ19fY3NzTW9kdWxlcycpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZWxlbWVudHNbMV0/LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdFx0aWYgKCF+X19jc3NNb2R1bGVzSW5kZXgpIHJldHVybjtcblx0XHRcdC8qIFRoaXMgcmVnaW9uIGFzc3VtZWVkIHRoYXQgdGhlIGVudGVyZWQgbm9kZSBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgU29tZUNvbXBvbmVudCA9IF9leHBvcnRfc2ZjKF9zZmNfbWFpbiwgW1tcImZvb1wiLCBiYXJdLCBbXCJfX2Nzc01vZHVsZXNcIiwgY3NzTW9kdWxlc11dKTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0Y29uc3QgY3NzTW9kdWxlRm9yZXN0TmFtZSA9ICgobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHNbX19jc3NNb2R1bGVzSW5kZXhdIGFzIGVzdHJlZS5BcnJheUV4cHJlc3Npb24pLmVsZW1lbnRzWzFdIGFzIGVzdHJlZS5JZGVudGlmaWVyKS5uYW1lO1xuXHRcdFx0Y29uc3QgY3NzTW9kdWxlRm9yZXN0Tm9kZSA9IHBhcmVudC5ib2R5LmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zWzBdLmlkLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gY3NzTW9kdWxlRm9yZXN0TmFtZSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaW5pdD8udHlwZSAhPT0gJ09iamVjdEV4cHJlc3Npb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuVmFyaWFibGVEZWNsYXJhdGlvbjtcblx0XHRcdGNvbnN0IG1vZHVsZUZvcmVzdCA9IG5ldyBNYXAoKGNzc01vZHVsZUZvcmVzdE5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQgYXMgZXN0cmVlLk9iamVjdEV4cHJlc3Npb24pLnByb3BlcnRpZXMuZmxhdE1hcCgocHJvcGVydHkpID0+IHtcblx0XHRcdFx0aWYgKHByb3BlcnR5LnR5cGUgIT09ICdQcm9wZXJ0eScpIHJldHVybiBbXTtcblx0XHRcdFx0aWYgKHByb3BlcnR5LmtleS50eXBlICE9PSAnTGl0ZXJhbCcpIHJldHVybiBbXTtcblx0XHRcdFx0aWYgKHByb3BlcnR5LnZhbHVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIFtdO1xuXHRcdFx0XHRyZXR1cm4gW1twcm9wZXJ0eS5rZXkudmFsdWUgYXMgc3RyaW5nLCBwcm9wZXJ0eS52YWx1ZS5uYW1lIGFzIHN0cmluZ11dO1xuXHRcdFx0fSkpO1xuXHRcdFx0LyogVGhpcyByZWdpb24gY29sbGVjdGVkIGEgVmFyaWFibGVEZWNsYXJhdGlvbiBub2RlIGluIHRoZSBtb2R1bGUgdGhhdCBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgY3NzTW9kdWxlcyA9IHtcblx0XHRcdCAqICAgXCIkc3R5bGVcIjogc3R5bGUwLFxuXHRcdFx0ICogfTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0Y29uc3Qgc2ZjTWFpbiA9IHBhcmVudC5ib2R5LmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zWzBdLmlkLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gaWRlbnQpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9KSBhcyB1bmtub3duIGFzIGVzdHJlZS5WYXJpYWJsZURlY2xhcmF0aW9uO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQ/LnR5cGUgIT09ICdDYWxsRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS5uYW1lICE9PSAnZGVmaW5lQ29tcG9uZW50JykgcmV0dXJuO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkgcmV0dXJuO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzBdLnR5cGUgIT09ICdPYmplY3RFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0Y29uc3Qgc2V0dXAgPSBzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzLmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1Byb3BlcnR5JykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5rZXkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmtleS5uYW1lICE9PSAnc2V0dXAnKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuUHJvcGVydHk7XG5cdFx0XHRpZiAoc2V0dXAudmFsdWUudHlwZSAhPT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGNvbnN0IHJlbmRlciA9IHNldHVwLnZhbHVlLmJvZHkuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdGlmICh4LnR5cGUgIT09ICdSZXR1cm5TdGF0ZW1lbnQnKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuUmV0dXJuU3RhdGVtZW50O1xuXHRcdFx0aWYgKHJlbmRlci5hcmd1bWVudD8udHlwZSAhPT0gJ0Fycm93RnVuY3Rpb25FeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0aWYgKHJlbmRlci5hcmd1bWVudC5wYXJhbXMubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cdFx0XHRjb25zdCBjdHggPSByZW5kZXIuYXJndW1lbnQucGFyYW1zWzBdO1xuXHRcdFx0aWYgKGN0eC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChjdHgubmFtZSAhPT0gJ19jdHgnKSByZXR1cm47XG5cdFx0XHRpZiAocmVuZGVyLmFyZ3VtZW50LmJvZHkudHlwZSAhPT0gJ0Jsb2NrU3RhdGVtZW50JykgcmV0dXJuO1xuXHRcdFx0LyogVGhpcyByZWdpb24gYXNzdW1lZCB0aGF0IGBzZmNNYWluYCBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgX3NmY19tYWluID0gZGVmaW5lQ29tcG9uZW50KHtcblx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHQgKiAgICAgLi4uXG5cdFx0XHQgKiAgICAgcmV0dXJuIChfY3R4LCBfY2FjaGUpID0+IHtcblx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0ICogICAgIH07XG5cdFx0XHQgKiAgIH0sXG5cdFx0XHQgKiB9KTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG1vZHVsZUZvcmVzdCkge1xuXHRcdFx0XHQvLyNyZWdpb25cblx0XHRcdFx0Y29uc3QgY3NzTW9kdWxlVHJlZU5vZGUgPSBwYXJlbnQuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zLmxlbmd0aCAhPT0gMSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gdmFsdWUpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuVmFyaWFibGVEZWNsYXJhdGlvbjtcblx0XHRcdFx0aWYgKGNzc01vZHVsZVRyZWVOb2RlLmRlY2xhcmF0aW9uc1swXS5pbml0Py50eXBlICE9PSAnT2JqZWN0RXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgbW9kdWxlVHJlZSA9IG5ldyBNYXAoY3NzTW9kdWxlVHJlZU5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQucHJvcGVydGllcy5mbGF0TWFwKChwcm9wZXJ0eSkgPT4ge1xuXHRcdFx0XHRcdGlmIChwcm9wZXJ0eS50eXBlICE9PSAnUHJvcGVydHknKSByZXR1cm4gW107XG5cdFx0XHRcdFx0Y29uc3QgYWN0dWFsS2V5ID0gcHJvcGVydHkua2V5LnR5cGUgPT09ICdJZGVudGlmaWVyJyA/IHByb3BlcnR5LmtleS5uYW1lIDogcHJvcGVydHkua2V5LnR5cGUgPT09ICdMaXRlcmFsJyA/IHByb3BlcnR5LmtleS52YWx1ZSA6IG51bGw7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBhY3R1YWxLZXkgIT09ICdzdHJpbmcnKSByZXR1cm4gW107XG5cdFx0XHRcdFx0aWYgKHByb3BlcnR5LnZhbHVlLnR5cGUgPT09ICdMaXRlcmFsJykgcmV0dXJuIFtbYWN0dWFsS2V5LCBwcm9wZXJ0eS52YWx1ZS52YWx1ZSBhcyBzdHJpbmddXTtcblx0XHRcdFx0XHRpZiAocHJvcGVydHkudmFsdWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm4gW107XG5cdFx0XHRcdFx0Y29uc3QgbGFiZWxsZWRWYWx1ZSA9IHByb3BlcnR5LnZhbHVlLm5hbWU7XG5cdFx0XHRcdFx0Y29uc3QgYWN0dWFsVmFsdWUgPSBwYXJlbnQuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoeC50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC5uYW1lICE9PSBsYWJlbGxlZFZhbHVlKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9KSBhcyB1bmtub3duIGFzIGVzdHJlZS5WYXJpYWJsZURlY2xhcmF0aW9uO1xuXHRcdFx0XHRcdGlmIChhY3R1YWxWYWx1ZS5kZWNsYXJhdGlvbnNbMF0uaW5pdD8udHlwZSAhPT0gJ0xpdGVyYWwnKSByZXR1cm4gW107XG5cdFx0XHRcdFx0cmV0dXJuIFtbYWN0dWFsS2V5LCBhY3R1YWxWYWx1ZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC52YWx1ZSBhcyBzdHJpbmddXTtcblx0XHRcdFx0fSkpO1xuXHRcdFx0XHQvKiBUaGlzIHJlZ2lvbiBjb2xsZWN0ZWQgVmFyaWFibGVEZWNsYXJhdGlvbiBub2RlcyBpbiB0aGUgbW9kdWxlIHRoYXQgbG9va3MgbGlrZSB0aGUgZm9sbG93aW5nIGNvZGUuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IGZvbyA9IFwiYmFyXCI7XG5cdFx0XHRcdCAqIGNvbnN0IGJheiA9IFwicXV4XCI7XG5cdFx0XHRcdCAqIGNvbnN0IHN0eWxlMCA9IHtcblx0XHRcdFx0ICogICBmb286IGZvbyxcblx0XHRcdFx0ICogICBiYXo6IGJheixcblx0XHRcdFx0ICogfTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdFx0Ly8jcmVnaW9uXG5cdFx0XHRcdCh3YWxrIGFzIHR5cGVvZiBlc3RyZWVXYWxrZXIud2FsaykocmVuZGVyLmFyZ3VtZW50LmJvZHksIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ01lbWJlckV4cHJlc3Npb24nKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0Lm9iamVjdC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0Lm9iamVjdC5uYW1lICE9PSBjdHgubmFtZSkgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QucHJvcGVydHkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5wcm9wZXJ0eS5uYW1lICE9PSBrZXkpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUucHJvcGVydHkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRjb25zdCBhY3R1YWxWYWx1ZSA9IG1vZHVsZVRyZWUuZ2V0KGNoaWxkTm9kZS5wcm9wZXJ0eS5uYW1lKTtcblx0XHRcdFx0XHRcdGlmIChhY3R1YWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnTGl0ZXJhbCcsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBhY3R1YWxWYWx1ZSxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHQvKiBUaGlzIHJlZ2lvbiBpbmxpbmVkIHRoZSByZWZlcmVuY2UgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgbmFtZSBpbiB0aGUgcmVuZGVyIGZ1bmN0aW9uIGludG8gdGhlIGFjdHVhbCBsaXRlcmFsLCBhcyBpbiB0aGUgZm9sbG93aW5nIGNvZGUuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHRcdCAqICAgICAuLi5cblx0XHRcdFx0ICogICAgIHJldHVybiAoX2N0eCwgX2NhY2hlKSA9PiB7XG5cdFx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgICByZXR1cm4gb3BlbkJsb2NrKCksIGNyZWF0ZUVsZW1lbnRCbG9jayhcImRpdlwiLCB7XG5cdFx0XHRcdCAqICAgICAgICAgY2xhc3M6IG5vcm1hbGl6ZUNsYXNzKF9jdHguJHN0eWxlLmZvbyksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIFx1MjE5M1xuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBub3JtYWxpemVDbGFzcyhcImJhclwiKSxcblx0XHRcdFx0ICogICAgICAgfSwgbnVsbCk7XG5cdFx0XHRcdCAqICAgICB9O1xuXHRcdFx0XHQgKiAgIH0sXG5cdFx0XHRcdCAqIH0pO1xuXHRcdFx0XHQgKi9cblx0XHRcdFx0Ly8jZW5kcmVnaW9uXG5cdFx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0XHQod2FsayBhcyB0eXBlb2YgZXN0cmVlV2Fsa2VyLndhbGspKHJlbmRlci5hcmd1bWVudC5ib2R5LCB7XG5cdFx0XHRcdFx0ZW50ZXIoY2hpbGROb2RlKSB7XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLnR5cGUgIT09ICdNZW1iZXJFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QudHlwZSAhPT0gJ01lbWJlckV4cHJlc3Npb24nKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5vYmplY3QudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5vYmplY3QubmFtZSAhPT0gY3R4Lm5hbWUpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0LnByb3BlcnR5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QucHJvcGVydHkubmFtZSAhPT0ga2V5KSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLnByb3BlcnR5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgVW5kZWZpbmVkIHN0eWxlIGRldGVjdGVkOiAke2tleX0uJHtjaGlsZE5vZGUucHJvcGVydHkubmFtZX0gKGluICR7bmFtZX0pYCk7XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6ICd1bmRlZmluZWQnLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdC8qIFRoaXMgcmVnaW9uIHJlcGxhY2VkIHRoZSByZWZlcmVuY2UgaWRlbnRpZmllciBvZiBtaXNzaW5nIGNsYXNzIG5hbWVzIGluIHRoZSByZW5kZXIgZnVuY3Rpb24gd2l0aCBgdW5kZWZpbmVkYCwgYXMgaW4gdGhlIGZvbGxvd2luZyBjb2RlLlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBub3JtYWxpemVDbGFzcyhfY3R4LiRzdHlsZS5ob2dlKSxcblx0XHRcdFx0ICogICAgICAgfSwgbnVsbCk7XG5cdFx0XHRcdCAqICAgICB9O1xuXHRcdFx0XHQgKiAgIH0sXG5cdFx0XHRcdCAqIH0pO1xuXHRcdFx0XHQgKiBgYGBcblx0XHRcdFx0ICpcblx0XHRcdFx0ICogXHUyMTkzXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHRcdCAqICAgICAuLi5cblx0XHRcdFx0ICogICAgIHJldHVybiAoX2N0eCwgX2NhY2hlKSA9PiB7XG5cdFx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgICByZXR1cm4gb3BlbkJsb2NrKCksIGNyZWF0ZUVsZW1lbnRCbG9jayhcImRpdlwiLCB7XG5cdFx0XHRcdCAqICAgICAgICAgY2xhc3M6IG5vcm1hbGl6ZUNsYXNzKHVuZGVmaW5lZCksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdFx0Ly8jcmVnaW9uXG5cdFx0XHRcdCh3YWxrIGFzIHR5cGVvZiBlc3RyZWVXYWxrZXIud2FsaykocmVuZGVyLmFyZ3VtZW50LmJvZHksIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ0NhbGxFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5jYWxsZWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLmNhbGxlZS5uYW1lICE9PSAnbm9ybWFsaXplQ2xhc3MnKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHJldHVybjtcblx0XHRcdFx0XHRcdGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDbGFzcyhjaGlsZE5vZGUuYXJndW1lbnRzWzBdLCBuYW1lKTtcblx0XHRcdFx0XHRcdGlmIChub3JtYWxpemVkID09PSBudWxsKSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnTGl0ZXJhbCcsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBub3JtYWxpemVkLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdC8qIFRoaXMgcmVnaW9uIGNvbXBpbGVkIHRoZSBgbm9ybWFsaXplQ2xhc3NgIGNhbGwgaW50byBhIHBzZXVkby1BT1QgY29tcGlsYXRpb24sIGFzIGluIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdFx0ICpcblx0XHRcdFx0ICogYGBgdHNcblx0XHRcdFx0ICogY29uc3QgX3NmY19tYWluID0gZGVmaW5lQ29tcG9uZW50KHtcblx0XHRcdFx0ICogICBzZXR1cChfcHJvcHMpIHtcblx0XHRcdFx0ICogICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgcmV0dXJuIChfY3R4LCBfY2FjaGUpID0+IHtcblx0XHRcdFx0ICogICAgICAgLi4uXG5cdFx0XHRcdCAqICAgICAgIHJldHVybiBvcGVuQmxvY2soKSwgY3JlYXRlRWxlbWVudEJsb2NrKFwiZGl2XCIsIHtcblx0XHRcdFx0ICogICAgICAgICBjbGFzczogbm9ybWFsaXplQ2xhc3MoXCJiYXJcIiksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIFx1MjE5M1xuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBcImJhclwiLFxuXHRcdFx0XHQgKiAgICAgICB9LCBudWxsKTtcblx0XHRcdFx0ICogICAgIH07XG5cdFx0XHRcdCAqICAgfSxcblx0XHRcdFx0ICogfSk7XG5cdFx0XHRcdCAqIGBgYFxuXHRcdFx0XHQgKi9cblx0XHRcdFx0Ly8jZW5kcmVnaW9uXG5cdFx0XHR9XG5cdFx0XHQvLyNyZWdpb25cblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1sxXS5lbGVtZW50cy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0KHdhbGsgYXMgdHlwZW9mIGVzdHJlZVdhbGtlci53YWxrKShhc3QsIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm5hbWUgIT09IGlkZW50KSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmlkLm5hbWUsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUoKTtcblx0XHRcdFx0LyogTk9URTogVGhlIGFib3ZlIGxvZ2ljIGlzIHZhbGlkIGFzIGxvbmcgYXMgdGhlIGZvbGxvd2luZyB0d28gY29uZGl0aW9ucyBhcmUgbWV0LlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiAtIHRoZSB1bmlxdWVuZXNzIG9mIGBpZGVudGAgaXMga2VwdCB0aHJvdWdob3V0IHRoZSBtb2R1bGVcblx0XHRcdFx0ICogLSBgX2V4cG9ydF9zZmNgIGlzIG5vb3Agd2hlbiB0aGUgc2Vjb25kIGFyZ3VtZW50IGlzIGFuIGVtcHR5IGFycmF5XG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIE90aGVyd2lzZSwgdGhlIGJlbG93IGxvZ2ljIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG5cblx0XHRcdFx0dGhpcy5yZXBsYWNlKHtcblx0XHRcdFx0XHR0eXBlOiAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG5cdFx0XHRcdFx0ZGVjbGFyYXRpb25zOiBbe1xuXHRcdFx0XHRcdFx0dHlwZTogJ1ZhcmlhYmxlRGVjbGFyYXRvcicsXG5cdFx0XHRcdFx0XHRpZDoge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmlkLm5hbWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0aW5pdDoge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IGlkZW50LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9XSxcblx0XHRcdFx0XHRraW5kOiAnY29uc3QnLFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0ICovXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdHR5cGU6ICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcblx0XHRcdFx0XHRkZWNsYXJhdGlvbnM6IFt7XG5cdFx0XHRcdFx0XHR0eXBlOiAnVmFyaWFibGVEZWNsYXJhdG9yJyxcblx0XHRcdFx0XHRcdGlkOiB7XG5cdFx0XHRcdFx0XHRcdHR5cGU6ICdJZGVudGlmaWVyJyxcblx0XHRcdFx0XHRcdFx0bmFtZTogbm9kZS5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRpbml0OiB7XG5cdFx0XHRcdFx0XHRcdHR5cGU6ICdDYWxsRXhwcmVzc2lvbicsXG5cdFx0XHRcdFx0XHRcdGNhbGxlZToge1xuXHRcdFx0XHRcdFx0XHRcdHR5cGU6ICdJZGVudGlmaWVyJyxcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiAnX2V4cG9ydF9zZmMnLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRhcmd1bWVudHM6IFt7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogJ0lkZW50aWZpZXInLFxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGlkZW50LFxuXHRcdFx0XHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogJ0FycmF5RXhwcmVzc2lvbicsXG5cdFx0XHRcdFx0XHRcdFx0ZWxlbWVudHM6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzFdLmVsZW1lbnRzLnNsaWNlKDAsIF9fY3NzTW9kdWxlc0luZGV4KS5jb25jYXQobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHMuc2xpY2UoX19jc3NNb2R1bGVzSW5kZXggKyAxKSksXG5cdFx0XHRcdFx0XHRcdH1dLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9XSxcblx0XHRcdFx0XHRraW5kOiAnY29uc3QnLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdC8qIFRoaXMgcmVnaW9uIHJlbW92ZWQgdGhlIGBfX2Nzc01vZHVsZXNgIHJlZmVyZW5jZSBmcm9tIHRoZSBzZWNvbmQgYXJndW1lbnQgb2YgYF9leHBvcnRfc2ZjYCwgYXMgaW4gdGhlIGZvbGxvd2luZyBjb2RlLlxuXHRcdFx0ICpcblx0XHRcdCAqIGBgYHRzXG5cdFx0XHQgKiBjb25zdCBTb21lQ29tcG9uZW50ID0gX2V4cG9ydF9zZmMoX3NmY19tYWluLCBbW1wiZm9vXCIsIGJhcl0sIFtcIl9fY3NzTW9kdWxlc1wiLCBjc3NNb2R1bGVzXV0pO1xuXHRcdFx0ICogYGBgXG5cdFx0XHQgKlxuXHRcdFx0ICogXHUyMTkzXG5cdFx0XHQgKlxuXHRcdFx0ICogYGBgdHNcblx0XHRcdCAqIGNvbnN0IFNvbWVDb21wb25lbnQgPSBfZXhwb3J0X3NmYyhfc2ZjX21haW4sIFtbXCJmb29cIiwgYmFyXV0pO1xuXHRcdFx0ICogYGBgXG5cdFx0XHQgKlxuXHRcdFx0ICogV2hlbiB0aGUgZGVjbGFyYXRpb24gYmVjb21lcyBub29wLCBpdCBpcyByZW1vdmVkIGFzIGZvbGxvd3MuXG5cdFx0XHQgKlxuXHRcdFx0ICogYGBgdHNcblx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHQgKiAgIC4uLlxuXHRcdFx0ICogfSk7XG5cdFx0XHQgKiBjb25zdCBTb21lQ29tcG9uZW50ID0gX2V4cG9ydF9zZmMoX3NmY19tYWluLCBbXSk7XG5cdFx0XHQgKiBgYGBcblx0XHRcdCAqXG5cdFx0XHQgKiBcdTIxOTNcblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgU29tZUNvbXBvbmVudCA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHQgKiAgIC4uLlxuXHRcdFx0ICogfSk7XG5cdFx0XHQgKi9cblx0XHRcdC8vI2VuZHJlZ2lvblxuXHRcdH0sXG5cdH0pO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwbHVnaW5VbndpbmRDc3NNb2R1bGVDbGFzc05hbWUoKTogUGx1Z2luIHtcblx0cmV0dXJuIHtcblx0XHRuYW1lOiAnVW53aW5kQ3NzTW9kdWxlQ2xhc3NOYW1lJyxcblx0XHRyZW5kZXJDaHVuayhjb2RlKTogeyBjb2RlOiBzdHJpbmcgfSB7XG5cdFx0XHRjb25zdCBhc3QgPSB0aGlzLnBhcnNlKGNvZGUpIGFzIHVua25vd24gYXMgZXN0cmVlLk5vZGU7XG5cdFx0XHR1bndpbmRDc3NNb2R1bGVDbGFzc05hbWUoYXN0KTtcblx0XHRcdHJldHVybiB7IGNvZGU6IGdlbmVyYXRlKGFzdCkgfTtcblx0XHR9LFxuXHR9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9taXNza2V5L2NvcmUvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9taXNza2V5L2NvcmUvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL3dhbGtlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9taXNza2V5L2NvcmUvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL3dhbGtlci5qc1wiOy8qKlxuICogQHR5cGVkZWYgeyBpbXBvcnQoJ2VzdHJlZScpLk5vZGV9IE5vZGVcbiAqIEB0eXBlZGVmIHt7XG4gKiAgIHNraXA6ICgpID0+IHZvaWQ7XG4gKiAgIHJlbW92ZTogKCkgPT4gdm9pZDtcbiAqICAgcmVwbGFjZTogKG5vZGU6IE5vZGUpID0+IHZvaWQ7XG4gKiB9fSBXYWxrZXJDb250ZXh0XG4gKi9cblxuZXhwb3J0IGNsYXNzIFdhbGtlckJhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5zaG91bGRfc2tpcCA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtOb2RlIHwgbnVsbH0gKi9cblx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdC8qKiBAdHlwZSB7V2Fsa2VyQ29udGV4dH0gKi9cblx0XHR0aGlzLmNvbnRleHQgPSB7XG5cdFx0XHRza2lwOiAoKSA9PiAodGhpcy5zaG91bGRfc2tpcCA9IHRydWUpLFxuXHRcdFx0cmVtb3ZlOiAoKSA9PiAodGhpcy5zaG91bGRfcmVtb3ZlID0gdHJ1ZSksXG5cdFx0XHRyZXBsYWNlOiAobm9kZSkgPT4gKHRoaXMucmVwbGFjZW1lbnQgPSBub2RlKVxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQHRlbXBsYXRlIHtOb2RlfSBQYXJlbnRcblx0ICogQHBhcmFtIHtQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwYXJlbnRcblx0ICogQHBhcmFtIHtrZXlvZiBQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwcm9wXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZH0gaW5kZXhcblx0ICogQHBhcmFtIHtOb2RlfSBub2RlXG5cdCAqL1xuXHRyZXBsYWNlKHBhcmVudCwgcHJvcCwgaW5kZXgsIG5vZGUpIHtcblx0XHRpZiAocGFyZW50ICYmIHByb3ApIHtcblx0XHRcdGlmIChpbmRleCAhPSBudWxsKSB7XG5cdFx0XHRcdC8qKiBAdHlwZSB7QXJyYXk8Tm9kZT59ICovIChwYXJlbnRbcHJvcF0pW2luZGV4XSA9IG5vZGU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvKiogQHR5cGUge05vZGV9ICovIChwYXJlbnRbcHJvcF0pID0gbm9kZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHRlbXBsYXRlIHtOb2RlfSBQYXJlbnRcblx0ICogQHBhcmFtIHtQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwYXJlbnRcblx0ICogQHBhcmFtIHtrZXlvZiBQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwcm9wXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZH0gaW5kZXhcblx0ICovXG5cdHJlbW92ZShwYXJlbnQsIHByb3AsIGluZGV4KSB7XG5cdFx0aWYgKHBhcmVudCAmJiBwcm9wKSB7XG5cdFx0XHRpZiAoaW5kZXggIT09IG51bGwgJiYgaW5kZXggIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQvKiogQHR5cGUge0FycmF5PE5vZGU+fSAqLyAocGFyZW50W3Byb3BdKS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlIHBhcmVudFtwcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9zeW5jLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL21pc3NrZXkvY29yZS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmMvc3luYy5qc1wiO2ltcG9ydCB7IFdhbGtlckJhc2UgfSBmcm9tICcuL3dhbGtlci5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYgeyBpbXBvcnQoJ2VzdHJlZScpLk5vZGV9IE5vZGVcbiAqIEB0eXBlZGVmIHsgaW1wb3J0KCcuL3dhbGtlci5qcycpLldhbGtlckNvbnRleHR9IFdhbGtlckNvbnRleHRcbiAqIEB0eXBlZGVmIHsoXG4gKiAgICB0aGlzOiBXYWxrZXJDb250ZXh0LFxuICogICAgbm9kZTogTm9kZSxcbiAqICAgIHBhcmVudDogTm9kZSB8IG51bGwsXG4gKiAgICBrZXk6IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCB8IG51bGwgfCB1bmRlZmluZWQsXG4gKiAgICBpbmRleDogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZFxuICogKSA9PiB2b2lkfSBTeW5jSGFuZGxlclxuICovXG5cbmV4cG9ydCBjbGFzcyBTeW5jV2Fsa2VyIGV4dGVuZHMgV2Fsa2VyQmFzZSB7XG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N5bmNIYW5kbGVyfSBbZW50ZXJdXG5cdCAqIEBwYXJhbSB7U3luY0hhbmRsZXJ9IFtsZWF2ZV1cblx0ICovXG5cdGNvbnN0cnVjdG9yKGVudGVyLCBsZWF2ZSkge1xuXHRcdHN1cGVyKCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5zaG91bGRfc2tpcCA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtOb2RlIHwgbnVsbH0gKi9cblx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdC8qKiBAdHlwZSB7V2Fsa2VyQ29udGV4dH0gKi9cblx0XHR0aGlzLmNvbnRleHQgPSB7XG5cdFx0XHRza2lwOiAoKSA9PiAodGhpcy5zaG91bGRfc2tpcCA9IHRydWUpLFxuXHRcdFx0cmVtb3ZlOiAoKSA9PiAodGhpcy5zaG91bGRfcmVtb3ZlID0gdHJ1ZSksXG5cdFx0XHRyZXBsYWNlOiAobm9kZSkgPT4gKHRoaXMucmVwbGFjZW1lbnQgPSBub2RlKVxuXHRcdH07XG5cblx0XHQvKiogQHR5cGUge1N5bmNIYW5kbGVyIHwgdW5kZWZpbmVkfSAqL1xuXHRcdHRoaXMuZW50ZXIgPSBlbnRlcjtcblxuXHRcdC8qKiBAdHlwZSB7U3luY0hhbmRsZXIgfCB1bmRlZmluZWR9ICovXG5cdFx0dGhpcy5sZWF2ZSA9IGxlYXZlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEB0ZW1wbGF0ZSB7Tm9kZX0gUGFyZW50XG5cdCAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuXHQgKiBAcGFyYW0ge1BhcmVudCB8IG51bGx9IHBhcmVudFxuXHQgKiBAcGFyYW0ge2tleW9mIFBhcmVudH0gW3Byb3BdXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW2luZGV4XVxuXHQgKiBAcmV0dXJucyB7Tm9kZSB8IG51bGx9XG5cdCAqL1xuXHR2aXNpdChub2RlLCBwYXJlbnQsIHByb3AsIGluZGV4KSB7XG5cdFx0aWYgKG5vZGUpIHtcblx0XHRcdGlmICh0aGlzLmVudGVyKSB7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfc2tpcCA9IHRoaXMuc2hvdWxkX3NraXA7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfcmVtb3ZlID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHRjb25zdCBfcmVwbGFjZW1lbnQgPSB0aGlzLnJlcGxhY2VtZW50O1xuXHRcdFx0XHR0aGlzLnNob3VsZF9za2lwID0gZmFsc2U7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdFx0XHR0aGlzLmVudGVyLmNhbGwodGhpcy5jb250ZXh0LCBub2RlLCBwYXJlbnQsIHByb3AsIGluZGV4KTtcblxuXHRcdFx0XHRpZiAodGhpcy5yZXBsYWNlbWVudCkge1xuXHRcdFx0XHRcdG5vZGUgPSB0aGlzLnJlcGxhY2VtZW50O1xuXHRcdFx0XHRcdHRoaXMucmVwbGFjZShwYXJlbnQsIHByb3AsIGluZGV4LCBub2RlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLnNob3VsZF9yZW1vdmUpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZShwYXJlbnQsIHByb3AsIGluZGV4KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHNraXBwZWQgPSB0aGlzLnNob3VsZF9za2lwO1xuXHRcdFx0XHRjb25zdCByZW1vdmVkID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdHRoaXMuc2hvdWxkX3NraXAgPSBfc2hvdWxkX3NraXA7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IF9zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gX3JlcGxhY2VtZW50O1xuXG5cdFx0XHRcdGlmIChza2lwcGVkKSByZXR1cm4gbm9kZTtcblx0XHRcdFx0aWYgKHJlbW92ZWQpIHJldHVybiBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogQHR5cGUge2tleW9mIE5vZGV9ICovXG5cdFx0XHRsZXQga2V5O1xuXG5cdFx0XHRmb3IgKGtleSBpbiBub2RlKSB7XG5cdFx0XHRcdC8qKiBAdHlwZSB7dW5rbm93bn0gKi9cblx0XHRcdFx0Y29uc3QgdmFsdWUgPSBub2RlW2tleV07XG5cblx0XHRcdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG5vZGVzID0gLyoqIEB0eXBlIHtBcnJheTx1bmtub3duPn0gKi8gKHZhbHVlKTtcblx0XHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgaXRlbSA9IG5vZGVzW2ldO1xuXHRcdFx0XHRcdFx0XHRpZiAoaXNOb2RlKGl0ZW0pKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCF0aGlzLnZpc2l0KGl0ZW0sIG5vZGUsIGtleSwgaSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIHJlbW92ZWRcblx0XHRcdFx0XHRcdFx0XHRcdGktLTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGlzTm9kZSh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdHRoaXMudmlzaXQodmFsdWUsIG5vZGUsIGtleSwgbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmxlYXZlKSB7XG5cdFx0XHRcdGNvbnN0IF9yZXBsYWNlbWVudCA9IHRoaXMucmVwbGFjZW1lbnQ7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfcmVtb3ZlID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblx0XHRcdFx0dGhpcy5zaG91bGRfcmVtb3ZlID0gZmFsc2U7XG5cblx0XHRcdFx0dGhpcy5sZWF2ZS5jYWxsKHRoaXMuY29udGV4dCwgbm9kZSwgcGFyZW50LCBwcm9wLCBpbmRleCk7XG5cblx0XHRcdFx0aWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcblx0XHRcdFx0XHRub2RlID0gdGhpcy5yZXBsYWNlbWVudDtcblx0XHRcdFx0XHR0aGlzLnJlcGxhY2UocGFyZW50LCBwcm9wLCBpbmRleCwgbm9kZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGhpcy5zaG91bGRfcmVtb3ZlKSB7XG5cdFx0XHRcdFx0dGhpcy5yZW1vdmUocGFyZW50LCBwcm9wLCBpbmRleCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCByZW1vdmVkID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdHRoaXMucmVwbGFjZW1lbnQgPSBfcmVwbGFjZW1lbnQ7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IF9zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdGlmIChyZW1vdmVkKSByZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbm9kZTtcblx0fVxufVxuXG4vKipcbiAqIER1Y2t0eXBlIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgTm9kZX1cbiAqL1xuZnVuY3Rpb24gaXNOb2RlKHZhbHVlKSB7XG5cdHJldHVybiAoXG5cdFx0dmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAndHlwZScgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnR5cGUgPT09ICdzdHJpbmcnXG5cdCk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL21pc3NrZXkvY29yZS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL21pc3NrZXkvY29yZS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmMvaW5kZXguanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbWlzc2tleS9jb3JlL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9pbmRleC5qc1wiO2ltcG9ydCB7IFN5bmNXYWxrZXIgfSBmcm9tICcuL3N5bmMuanMnO1xuaW1wb3J0IHsgQXN5bmNXYWxrZXIgfSBmcm9tICcuL2FzeW5jLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCdlc3RyZWUnKS5Ob2RlfSBOb2RlXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3N5bmMuanMnKS5TeW5jSGFuZGxlcn0gU3luY0hhbmRsZXJcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYXN5bmMuanMnKS5Bc3luY0hhbmRsZXJ9IEFzeW5jSGFuZGxlclxuICovXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBhc3RcbiAqIEBwYXJhbSB7e1xuICogICBlbnRlcj86IFN5bmNIYW5kbGVyXG4gKiAgIGxlYXZlPzogU3luY0hhbmRsZXJcbiAqIH19IHdhbGtlclxuICogQHJldHVybnMge05vZGUgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2Fsayhhc3QsIHsgZW50ZXIsIGxlYXZlIH0pIHtcblx0Y29uc3QgaW5zdGFuY2UgPSBuZXcgU3luY1dhbGtlcihlbnRlciwgbGVhdmUpO1xuXHRyZXR1cm4gaW5zdGFuY2UudmlzaXQoYXN0LCBudWxsKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IGFzdFxuICogQHBhcmFtIHt7XG4gKiAgIGVudGVyPzogQXN5bmNIYW5kbGVyXG4gKiAgIGxlYXZlPzogQXN5bmNIYW5kbGVyXG4gKiB9fSB3YWxrZXJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE5vZGUgfCBudWxsPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzeW5jV2Fsayhhc3QsIHsgZW50ZXIsIGxlYXZlIH0pIHtcblx0Y29uc3QgaW5zdGFuY2UgPSBuZXcgQXN5bmNXYWxrZXIoZW50ZXIsIGxlYXZlKTtcblx0cmV0dXJuIGF3YWl0IGluc3RhbmNlLnZpc2l0KGFzdCwgbnVsbCk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL21pc3NrZXkvY29yZS9wYWNrYWdlcy9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuanNvbjUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbWlzc2tleS9jb3JlL3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuanNvbjUudHNcIjsvLyBPcmlnaW5hbDogaHR0cHM6Ly9naXRodWIuY29tL3JvbGx1cC9wbHVnaW5zL3RyZWUvODgzNWRkMmFlZDkyZjQwOGQ3ZGM3MmQ3Y2MyNWE5NzI4ZTE2ZmFjZS9wYWNrYWdlcy9qc29uXG5cbmltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICdyb2xsdXAnO1xuaW1wb3J0IHsgY3JlYXRlRmlsdGVyLCBkYXRhVG9Fc20gfSBmcm9tICdAcm9sbHVwL3BsdWdpbnV0aWxzJztcbmltcG9ydCB7IFJvbGx1cEpzb25PcHRpb25zIH0gZnJvbSAnQHJvbGx1cC9wbHVnaW4tanNvbic7XG5cbi8vIGpzb241IGV4dGVuZHMgU3ludGF4RXJyb3Igd2l0aCBhZGRpdGlvbmFsIGZpZWxkcyAod2l0aG91dCBzdWJjbGFzc2luZylcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qc29uNS9qc29uNS9ibG9iL2RlMzQ0ZjA2MTliZGExNDY1YTZlMjVjNzZmMWMwYzNkZGE4MTA4ZDkvbGliL3BhcnNlLmpzI0wxMTExLUwxMTEyXG5pbnRlcmZhY2UgSnNvbjVTeW50YXhFcnJvciBleHRlbmRzIFN5bnRheEVycm9yIHtcblx0bGluZU51bWJlcjogbnVtYmVyO1xuXHRjb2x1bW5OdW1iZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ganNvbjUob3B0aW9uczogUm9sbHVwSnNvbk9wdGlvbnMgPSB7fSk6IFBsdWdpbiB7XG5cdGNvbnN0IGZpbHRlciA9IGNyZWF0ZUZpbHRlcihvcHRpb25zLmluY2x1ZGUsIG9wdGlvbnMuZXhjbHVkZSk7XG5cdGNvbnN0IGluZGVudCA9ICdpbmRlbnQnIGluIG9wdGlvbnMgPyBvcHRpb25zLmluZGVudCA6ICdcXHQnO1xuXG5cdHJldHVybiB7XG5cdFx0bmFtZTogJ2pzb241JyxcblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcblx0XHR0cmFuc2Zvcm0oanNvbiwgaWQpIHtcblx0XHRcdGlmIChpZC5zbGljZSgtNikgIT09ICcuanNvbjUnIHx8ICFmaWx0ZXIoaWQpKSByZXR1cm4gbnVsbDtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgcGFyc2VkID0gSlNPTjUucGFyc2UoanNvbik7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0Y29kZTogZGF0YVRvRXNtKHBhcnNlZCwge1xuXHRcdFx0XHRcdFx0cHJlZmVyQ29uc3Q6IG9wdGlvbnMucHJlZmVyQ29uc3QsXG5cdFx0XHRcdFx0XHRjb21wYWN0OiBvcHRpb25zLmNvbXBhY3QsXG5cdFx0XHRcdFx0XHRuYW1lZEV4cG9ydHM6IG9wdGlvbnMubmFtZWRFeHBvcnRzLFxuXHRcdFx0XHRcdFx0aW5kZW50LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG1hcDogeyBtYXBwaW5nczogJycgfSxcblx0XHRcdFx0fTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRpZiAoIShlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikpIHtcblx0XHRcdFx0XHR0aHJvdyBlcnI7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgbWVzc2FnZSA9ICdDb3VsZCBub3QgcGFyc2UgSlNPTjUgZmlsZSc7XG5cdFx0XHRcdGNvbnN0IHsgbGluZU51bWJlciwgY29sdW1uTnVtYmVyIH0gPSBlcnIgYXMgSnNvbjVTeW50YXhFcnJvcjtcblx0XHRcdFx0dGhpcy53YXJuKHsgbWVzc2FnZSwgaWQsIGxvYzogeyBsaW5lOiBsaW5lTnVtYmVyLCBjb2x1bW46IGNvbHVtbk51bWJlciB9IH0pO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4UixPQUFPLFVBQVU7QUFDL1MsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxlQUFlO0FBQ3RCLFNBQTBCLG9CQUFvQjs7O0FDQzlDLFlBQVksUUFBUTtBQUNwQixZQUFZLFVBQVU7QUFMZ0ksSUFBTSwyQ0FBMkM7QUFPdk0sSUFBTSxRQUFRLElBQUksU0FBUyxLQUFLLE9B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
