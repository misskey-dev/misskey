// vite.config.local-dev.ts
import dns from "dns";
import { readFile } from "node:fs/promises";
import { defineConfig as defineConfig2 } from "file:///workspaces/misskey/node_modules/.pnpm/vite@5.4.8_@types+node@20.14.12_sass@1.79.3_terser@5.33.0/node_modules/vite/dist/node/index.js";
import * as yaml2 from "file:///workspaces/misskey/node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml/dist/js-yaml.mjs";

// ../../locales/index.js
import * as fs from "node:fs";
import * as yaml from "file:///workspaces/misskey/node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml/dist/js-yaml.mjs";
var __vite_injected_original_import_meta_url = "file:///workspaces/misskey/locales/index.js";
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
  const metaUrl = __vite_injected_original_import_meta_url;
  const locales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`${c}.yml`, metaUrl), "utf-8"))) || {}, a), {});
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

// vite.config.ts
import path from "path";
import pluginReplace from "file:///workspaces/misskey/node_modules/.pnpm/@rollup+plugin-replace@5.0.7_rollup@4.22.5/node_modules/@rollup/plugin-replace/dist/es/index.js";
import pluginVue from "file:///workspaces/misskey/node_modules/.pnpm/@vitejs+plugin-vue@5.1.4_vite@5.4.8_@types+node@20.14.12_sass@1.79.3_terser@5.33.0__vue@3.5.10_typescript@5.6.2_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "file:///workspaces/misskey/node_modules/.pnpm/vite@5.4.8_@types+node@20.14.12_sass@1.79.3_terser@5.33.0/node_modules/vite/dist/node/index.js";

// ../../package.json
var package_default = {
  name: "misskey",
  version: "2024.9.0-shahu.1.4.0",
  codename: "nasubi",
  repository: {
    type: "git",
    url: "https://github.com/team-shahu/misskey"
  },
  packageManager: "pnpm@9.6.0",
  workspaces: [
    "packages/frontend-shared",
    "packages/frontend",
    "packages/frontend-embed",
    "packages/backend",
    "packages/sw",
    "packages/misskey-js",
    "packages/misskey-reversi",
    "packages/misskey-bubble-game"
  ],
  private: true,
  scripts: {
    "build-pre": "node ./scripts/build-pre.js",
    "build-assets": "node ./scripts/build-assets.mjs",
    build: "pnpm build-pre && pnpm -r build && pnpm build-assets",
    "build-storybook": "pnpm --filter frontend build-storybook",
    "build-misskey-js-with-types": "pnpm build-pre && pnpm --filter backend... --filter=!misskey-js build && pnpm --filter backend generate-api-json --no-build && ncp packages/backend/built/api.json packages/misskey-js/generator/api.json && pnpm --filter misskey-js update-autogen-code && pnpm --filter misskey-js build && pnpm --filter misskey-js api",
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
    "e2e-dev-container": "cp ./.config/cypress-devcontainer.yml ./.config/test.yml && pnpm start-server-and-test start:test http://localhost:61812 cy:run",
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
    "@isaacs/ttlcache": "^1.4.1",
    cssnano: "6.1.2",
    execa: "8.0.1",
    "fast-glob": "3.3.2",
    "ignore-walk": "6.0.5",
    "js-yaml": "4.1.0",
    postcss: "8.4.47",
    tar: "6.2.1",
    terser: "5.33.0",
    typescript: "5.6.2",
    esbuild: "0.23.1",
    glob: "11.0.0"
  },
  devDependencies: {
    "@misskey-dev/eslint-plugin": "2.0.3",
    "@types/node": "20.14.12",
    "@typescript-eslint/eslint-plugin": "7.17.0",
    "@typescript-eslint/parser": "7.17.0",
    "cross-env": "7.0.3",
    cypress: "13.14.2",
    eslint: "9.8.0",
    globals: "15.9.0",
    ncp: "2.0.0",
    "start-server-and-test": "2.0.8"
  },
  optionalDependencies: {
    "@tensorflow/tfjs-core": "4.4.0"
  }
};

// package.json
var package_default2 = {
  name: "frontend",
  private: true,
  type: "module",
  scripts: {
    watch: "vite",
    dev: "vite --config vite.config.local-dev.ts --debug hmr",
    build: "vite build",
    "storybook-dev": 'nodemon --verbose --watch src --ext "mdx,ts,vue" --ignore "*.stories.ts" --exec "pnpm build-storybook-pre && pnpm exec storybook dev -p 6006 --ci"',
    "build-storybook-pre": "(tsc -p .storybook || echo done.) && node .storybook/generate.js && node .storybook/preload-locale.js && node .storybook/preload-theme.js",
    "build-storybook": "pnpm build-storybook-pre && storybook build --webpack-stats-json storybook-static",
    chromatic: "chromatic",
    test: "vitest --run --globals",
    "test-and-coverage": "vitest --run --coverage --globals",
    typecheck: "vue-tsc --noEmit",
    eslint: 'eslint --quiet "src/**/*.{ts,vue}"',
    lint: "pnpm typecheck && pnpm eslint"
  },
  dependencies: {
    "@discordapp/twemoji": "15.1.0",
    "@github/webauthn-json": "2.1.1",
    "@mcaptcha/vanilla-glue": "0.1.0-alpha-3",
    "@misskey-dev/browser-image-resizer": "2024.1.0",
    "@rollup/plugin-json": "6.1.0",
    "@rollup/plugin-replace": "5.0.7",
    "@rollup/pluginutils": "5.1.2",
    "@syuilo/aiscript": "0.19.0",
    "@tabler/icons-webfont": "3.3.0",
    "@twemoji/parser": "15.1.1",
    "@vitejs/plugin-vue": "5.1.4",
    "@vue/compiler-sfc": "3.5.10",
    "aiscript-vscode": "github:aiscript-dev/aiscript-vscode#v0.1.11",
    astring: "1.9.0",
    "broadcast-channel": "7.0.0",
    buraha: "0.0.1",
    "canvas-confetti": "1.9.3",
    "chart.js": "4.4.4",
    "chartjs-adapter-date-fns": "3.0.0",
    "chartjs-chart-matrix": "2.0.1",
    "chartjs-plugin-gradient": "0.6.1",
    "chartjs-plugin-zoom": "2.0.1",
    chromatic: "11.10.4",
    "compare-versions": "6.1.1",
    cropperjs: "2.0.0-rc.2",
    "date-fns": "2.30.0",
    "estree-walker": "3.0.3",
    eventemitter3: "5.0.1",
    "idb-keyval": "6.2.1",
    "insert-text-at-cursor": "0.3.0",
    "is-file-animated": "1.0.2",
    json5: "2.2.3",
    "matter-js": "0.19.0",
    "mfm-js": "0.24.0",
    "misskey-bubble-game": "workspace:*",
    "misskey-js": "workspace:*",
    "misskey-reversi": "workspace:*",
    "frontend-shared": "workspace:*",
    photoswipe: "5.4.4",
    punycode: "2.3.1",
    rollup: "4.22.5",
    "sanitize-html": "2.13.0",
    sass: "1.79.3",
    shiki: "1.12.0",
    "strict-event-emitter-types": "2.0.0",
    "textarea-caret": "3.1.0",
    three: "0.169.0",
    "throttle-debounce": "5.0.2",
    tinycolor2: "1.6.0",
    "tsc-alias": "1.8.10",
    "tsconfig-paths": "4.2.0",
    typescript: "5.6.2",
    uuid: "10.0.0",
    "v-code-diff": "1.13.1",
    vite: "5.4.8",
    vue: "3.5.10",
    vuedraggable: "next"
  },
  devDependencies: {
    "@misskey-dev/summaly": "5.1.0",
    "@storybook/addon-actions": "8.3.3",
    "@storybook/addon-essentials": "8.3.3",
    "@storybook/addon-interactions": "8.3.3",
    "@storybook/addon-links": "8.3.3",
    "@storybook/addon-mdx-gfm": "8.3.3",
    "@storybook/addon-storysource": "8.3.3",
    "@storybook/blocks": "8.3.3",
    "@storybook/components": "8.3.3",
    "@storybook/core-events": "8.3.3",
    "@storybook/manager-api": "8.3.3",
    "@storybook/preview-api": "8.3.3",
    "@storybook/react": "8.3.3",
    "@storybook/react-vite": "8.3.3",
    "@storybook/test": "8.3.3",
    "@storybook/theming": "8.3.3",
    "@storybook/types": "8.3.3",
    "@storybook/vue3": "8.3.3",
    "@storybook/vue3-vite": "8.3.3",
    "@testing-library/vue": "8.1.0",
    "@types/estree": "1.0.6",
    "@types/matter-js": "0.19.7",
    "@types/micromatch": "4.0.9",
    "@types/node": "20.14.12",
    "@types/punycode": "2.1.4",
    "@types/sanitize-html": "2.13.0",
    "@types/seedrandom": "3.0.8",
    "@types/throttle-debounce": "5.0.2",
    "@types/tinycolor2": "1.4.6",
    "@types/uuid": "10.0.0",
    "@types/ws": "8.5.12",
    "@typescript-eslint/eslint-plugin": "7.17.0",
    "@typescript-eslint/parser": "7.17.0",
    "@vitest/coverage-v8": "1.6.0",
    "@vue/runtime-core": "3.5.10",
    acorn: "8.12.1",
    "cross-env": "7.0.3",
    cypress: "13.15.0",
    "eslint-plugin-import": "2.30.0",
    "eslint-plugin-vue": "9.28.0",
    "fast-glob": "3.3.2",
    "happy-dom": "10.0.3",
    "intersection-observer": "0.12.2",
    micromatch: "4.0.8",
    msw: "2.4.9",
    "msw-storybook-addon": "2.0.3",
    nodemon: "3.1.7",
    prettier: "3.3.3",
    react: "18.3.1",
    "react-dom": "18.3.1",
    seedrandom: "3.0.5",
    "start-server-and-test": "2.0.8",
    storybook: "8.3.3",
    "storybook-addon-misskey-theme": "github:misskey-dev/storybook-addon-misskey-theme",
    "vite-plugin-turbosnap": "1.0.3",
    vitest: "1.6.0",
    "vitest-fetch-mock": "0.2.2",
    "vue-component-type-helpers": "2.1.6",
    "vue-eslint-parser": "9.4.3",
    "vue-tsc": "2.1.6"
  }
};

// lib/rollup-plugin-unwind-css-module-class-name.ts
import { generate } from "file:///workspaces/misskey/node_modules/.pnpm/astring@1.9.0/node_modules/astring/dist/astring.mjs";

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
        if (skipped) return node;
        if (removed) return null;
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
        if (removed) return null;
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
  if (tree.type === "Identifier") return isFalsyIdentifier(tree) ? "" : null;
  if (tree.type === "Literal") return typeof tree.value === "string" ? tree.value : "";
  if (tree.type === "BinaryExpression") {
    if (tree.operator !== "+") return null;
    const left = normalizeClassWalker(tree.left, stack);
    const right = normalizeClassWalker(tree.right, stack);
    if (left === null || right === null) return null;
    return `${left}${right}`;
  }
  if (tree.type === "TemplateLiteral") {
    if (tree.expressions.some((x) => x.type !== "Literal" && (x.type !== "Identifier" || !isFalsyIdentifier(x)))) return null;
    return tree.quasis.reduce((a, c, i) => {
      const v = i === tree.quasis.length - 1 ? "" : tree.expressions[i].value;
      return a + c.value.raw + (typeof v === "string" ? v : "");
    }, "");
  }
  if (tree.type === "ArrayExpression") {
    const values = tree.elements.map((treeNode) => {
      if (treeNode === null) return "";
      if (treeNode.type === "SpreadElement") return normalizeClassWalker(treeNode.argument, stack);
      return normalizeClassWalker(treeNode, stack);
    });
    if (values.some((x) => x === null)) return null;
    return values.join(" ");
  }
  if (tree.type === "ObjectExpression") {
    const values = tree.properties.map((treeNode) => {
      if (treeNode.type === "SpreadElement") return normalizeClassWalker(treeNode.argument, stack);
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
    if (values.some((x) => x === null)) return null;
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
      if (parent?.type !== "Program") return;
      if (node.type !== "VariableDeclaration") return;
      if (node.declarations.length !== 1) return;
      if (node.declarations[0].id.type !== "Identifier") return;
      const name = node.declarations[0].id.name;
      if (node.declarations[0].init?.type !== "CallExpression") return;
      if (node.declarations[0].init.callee.type !== "Identifier") return;
      if (node.declarations[0].init.callee.name !== "_export_sfc") return;
      if (node.declarations[0].init.arguments.length !== 2) return;
      if (node.declarations[0].init.arguments[0].type !== "Identifier") return;
      const ident = node.declarations[0].init.arguments[0].name;
      if (!ident.startsWith("_sfc_main")) return;
      if (node.declarations[0].init.arguments[1].type !== "ArrayExpression") return;
      if (node.declarations[0].init.arguments[1].elements.length === 0) return;
      const __cssModulesIndex = node.declarations[0].init.arguments[1].elements.findIndex((x) => {
        if (x?.type !== "ArrayExpression") return false;
        if (x.elements.length !== 2) return false;
        if (x.elements[0]?.type !== "Literal") return false;
        if (x.elements[0].value !== "__cssModules") return false;
        if (x.elements[1]?.type !== "Identifier") return false;
        return true;
      });
      if (!~__cssModulesIndex) return;
      const cssModuleForestName = node.declarations[0].init.arguments[1].elements[__cssModulesIndex].elements[1].name;
      const cssModuleForestNode = parent.body.find((x) => {
        if (x.type !== "VariableDeclaration") return false;
        if (x.declarations.length !== 1) return false;
        if (x.declarations[0].id.type !== "Identifier") return false;
        if (x.declarations[0].id.name !== cssModuleForestName) return false;
        if (x.declarations[0].init?.type !== "ObjectExpression") return false;
        return true;
      });
      const moduleForest = new Map(cssModuleForestNode.declarations[0].init.properties.flatMap((property) => {
        if (property.type !== "Property") return [];
        if (property.key.type !== "Literal") return [];
        if (property.value.type !== "Identifier") return [];
        return [[property.key.value, property.value.name]];
      }));
      const sfcMain = parent.body.find((x) => {
        if (x.type !== "VariableDeclaration") return false;
        if (x.declarations.length !== 1) return false;
        if (x.declarations[0].id.type !== "Identifier") return false;
        if (x.declarations[0].id.name !== ident) return false;
        return true;
      });
      if (sfcMain.declarations[0].init?.type !== "CallExpression") return;
      if (sfcMain.declarations[0].init.callee.type !== "Identifier") return;
      if (sfcMain.declarations[0].init.callee.name !== "defineComponent") return;
      if (sfcMain.declarations[0].init.arguments.length !== 1) return;
      if (sfcMain.declarations[0].init.arguments[0].type !== "ObjectExpression") return;
      const setup = sfcMain.declarations[0].init.arguments[0].properties.find((x) => {
        if (x.type !== "Property") return false;
        if (x.key.type !== "Identifier") return false;
        if (x.key.name !== "setup") return false;
        return true;
      });
      if (setup.value.type !== "FunctionExpression") return;
      const render = setup.value.body.body.find((x) => {
        if (x.type !== "ReturnStatement") return false;
        return true;
      });
      if (render.argument?.type !== "ArrowFunctionExpression") return;
      if (render.argument.params.length !== 2) return;
      const ctx = render.argument.params[0];
      if (ctx.type !== "Identifier") return;
      if (ctx.name !== "_ctx") return;
      if (render.argument.body.type !== "BlockStatement") return;
      for (const [key, value] of moduleForest) {
        const cssModuleTreeNode = parent.body.find((x) => {
          if (x.type !== "VariableDeclaration") return false;
          if (x.declarations.length !== 1) return false;
          if (x.declarations[0].id.type !== "Identifier") return false;
          if (x.declarations[0].id.name !== value) return false;
          return true;
        });
        if (cssModuleTreeNode.declarations[0].init?.type !== "ObjectExpression") return;
        const moduleTree = new Map(cssModuleTreeNode.declarations[0].init.properties.flatMap((property) => {
          if (property.type !== "Property") return [];
          const actualKey = property.key.type === "Identifier" ? property.key.name : property.key.type === "Literal" ? property.key.value : null;
          if (typeof actualKey !== "string") return [];
          if (property.value.type === "Literal") return [[actualKey, property.value.value]];
          if (property.value.type !== "Identifier") return [];
          const labelledValue = property.value.name;
          const actualValue = parent.body.find((x) => {
            if (x.type !== "VariableDeclaration") return false;
            if (x.declarations.length !== 1) return false;
            if (x.declarations[0].id.type !== "Identifier") return false;
            if (x.declarations[0].id.name !== labelledValue) return false;
            return true;
          });
          if (actualValue.declarations[0].init?.type !== "Literal") return [];
          return [[actualKey, actualValue.declarations[0].init.value]];
        }));
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "MemberExpression") return;
            if (childNode.object.type !== "MemberExpression") return;
            if (childNode.object.object.type !== "Identifier") return;
            if (childNode.object.object.name !== ctx.name) return;
            if (childNode.object.property.type !== "Identifier") return;
            if (childNode.object.property.name !== key) return;
            if (childNode.property.type !== "Identifier") return;
            const actualValue = moduleTree.get(childNode.property.name);
            if (actualValue === void 0) return;
            this.replace({
              type: "Literal",
              value: actualValue
            });
          }
        });
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "MemberExpression") return;
            if (childNode.object.type !== "MemberExpression") return;
            if (childNode.object.object.type !== "Identifier") return;
            if (childNode.object.object.name !== ctx.name) return;
            if (childNode.object.property.type !== "Identifier") return;
            if (childNode.object.property.name !== key) return;
            if (childNode.property.type !== "Identifier") return;
            console.error(`Undefined style detected: ${key}.${childNode.property.name} (in ${name})`);
            this.replace({
              type: "Identifier",
              name: "undefined"
            });
          }
        });
        walk(render.argument.body, {
          enter(childNode) {
            if (childNode.type !== "CallExpression") return;
            if (childNode.callee.type !== "Identifier") return;
            if (childNode.callee.name !== "normalizeClass") return;
            if (childNode.arguments.length !== 1) return;
            const normalized = normalizeClass(childNode.arguments[0], name);
            if (normalized === null) return;
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
            if (childNode.type !== "Identifier") return;
            if (childNode.name !== ident) return;
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
import JSON5 from "file:///workspaces/misskey/node_modules/.pnpm/json5@2.2.3/node_modules/json5/lib/index.js";
import { createFilter, dataToEsm } from "file:///workspaces/misskey/node_modules/.pnpm/@rollup+pluginutils@5.1.2_rollup@4.22.5/node_modules/@rollup/pluginutils/dist/es/index.js";
function json5(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = "indent" in options ? options.indent : "	";
  return {
    name: "json5",
    // eslint-disable-next-line no-shadow
    transform(json, id) {
      if (id.slice(-6) !== ".json5" || !filter(id)) return null;
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
var __vite_injected_original_dirname = "/workspaces/misskey/packages/frontend";
var extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".json5", ".svg", ".sass", ".scss", ".css", ".vue"];
var externalPackages = [
  // shiki（コードブロックのシンタックスハイライトで使用中）はテーマ・言語の定義の容量が大きいため、それらはCDNから読み込む
  {
    name: "shiki",
    match: /^shiki\/(?<subPkg>(langs|themes))$/,
    path(id, pattern) {
      const match = pattern.exec(id)?.groups;
      return match ? `https://esm.sh/shiki@${package_default2.dependencies.shiki}/${match["subPkg"]}` : id;
    }
  }
];
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
      port: 5173,
      headers: {
        // なんか効かない
        "X-Frame-Options": "DENY"
      }
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
        "@@/": __vite_injected_original_dirname + "/../frontend-shared/",
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
        external: externalPackages.map((p) => p.match),
        output: {
          manualChunks: {
            vue: ["vue"],
            photoswipe: ["photoswipe", "photoswipe/lightbox", "photoswipe/style.css"]
          },
          chunkFileNames: process.env.NODE_ENV === "production" ? "[hash:8].js" : "[name]-[hash:8].js",
          assetFileNames: process.env.NODE_ENV === "production" ? "[hash:8][extname]" : "[name]-[hash:8][extname]",
          paths(id) {
            for (const p of externalPackages) {
              if (p.match.test(id)) {
                return p.path(id, p.match);
              }
            }
            return id;
          }
        }
      },
      cssCodeSplit: true,
      outDir: __vite_injected_original_dirname + "/../../built/_frontend_vite_",
      assetsDir: ".",
      emptyOutDir: false,
      sourcemap: process.env.NODE_ENV === "development",
      reportCompressedSize: false,
      // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
      commonjsOptions: {
        include: [/misskey-js/, /misskey-reversi/, /misskey-bubble-game/, /node_modules/]
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
      },
      includeSource: ["src/**/*.ts"]
    }
  };
}
var config = defineConfig(({ command, mode }) => getConfig());

// vite.config.local-dev.ts
dns.setDefaultResultOrder("ipv4first");
var defaultConfig = getConfig();
var { port } = yaml2.load(await readFile("../../.config/default.yml", "utf-8"));
var httpUrl = `http://localhost:${port}/`;
var websocketUrl = `ws://localhost:${port}/`;
var embedUrl = `http://localhost:5174/`;
function varyHandler(req) {
  if (req.headers.accept?.includes("application/activity+json")) {
    return null;
  }
  return "/index.html";
}
var devConfig = {
  // 基本の設定は vite.config.js から引き継ぐ
  ...defaultConfig,
  root: "src",
  publicDir: "../assets",
  base: "./",
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": {
        changeOrigin: true,
        target: httpUrl
      },
      "/assets": httpUrl,
      "/static-assets": httpUrl,
      "/client-assets": httpUrl,
      "/files": httpUrl,
      "/twemoji": httpUrl,
      "/fluent-emoji": httpUrl,
      "/sw.js": httpUrl,
      "/streaming": {
        target: websocketUrl,
        ws: true
      },
      "/favicon.ico": httpUrl,
      "/robots.txt": httpUrl,
      "/embed.js": httpUrl,
      "/embed": {
        target: embedUrl,
        ws: true
      },
      "/identicon": {
        target: httpUrl,
        rewrite(path2) {
          return path2.replace("@localhost:5173", "");
        }
      },
      "/url": httpUrl,
      "/proxy": httpUrl,
      "/_info_card_": httpUrl,
      "/bios": httpUrl,
      "/cli": httpUrl,
      "/inbox": httpUrl,
      "/emoji/": httpUrl,
      "/notes": {
        target: httpUrl,
        bypass: varyHandler
      },
      "/users": {
        target: httpUrl,
        bypass: varyHandler
      },
      "/.well-known": {
        target: httpUrl
      }
    }
  },
  build: {
    ...defaultConfig.build,
    rollupOptions: {
      ...defaultConfig.build?.rollupOptions,
      input: "index.html"
    }
  },
  define: {
    ...defaultConfig.define,
    _LANGS_FULL_: JSON.stringify(Object.entries(locales_default))
  }
};
var vite_config_local_dev_default = defineConfig2(({ command, mode }) => devConfig);
export {
  vite_config_local_dev_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubG9jYWwtZGV2LnRzIiwgIi4uLy4uL2xvY2FsZXMvaW5kZXguanMiLCAidml0ZS5jb25maWcudHMiLCAiLi4vLi4vcGFja2FnZS5qc29uIiwgInBhY2thZ2UuanNvbiIsICJsaWIvcm9sbHVwLXBsdWdpbi11bndpbmQtY3NzLW1vZHVsZS1jbGFzcy1uYW1lLnRzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy93YWxrZXIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL3N5bmMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL2luZGV4LmpzIiwgInZpdGUuanNvbjUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmxvY2FsLWRldi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmxvY2FsLWRldi50c1wiO2ltcG9ydCBkbnMgZnJvbSAnZG5zJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSB9IGZyb20gJ25vZGU6aHR0cCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB0eXBlIHsgVXNlckNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0ICogYXMgeWFtbCBmcm9tICdqcy15YW1sJztcbmltcG9ydCBsb2NhbGVzIGZyb20gJy4uLy4uL2xvY2FsZXMvaW5kZXguanMnO1xuaW1wb3J0IHsgZ2V0Q29uZmlnIH0gZnJvbSAnLi92aXRlLmNvbmZpZy5qcyc7XG5cbmRucy5zZXREZWZhdWx0UmVzdWx0T3JkZXIoJ2lwdjRmaXJzdCcpO1xuXG5jb25zdCBkZWZhdWx0Q29uZmlnID0gZ2V0Q29uZmlnKCk7XG5cbmNvbnN0IHsgcG9ydCB9ID0geWFtbC5sb2FkKGF3YWl0IHJlYWRGaWxlKCcuLi8uLi8uY29uZmlnL2RlZmF1bHQueW1sJywgJ3V0Zi04JykpO1xuXG5jb25zdCBodHRwVXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9gO1xuY29uc3Qgd2Vic29ja2V0VXJsID0gYHdzOi8vbG9jYWxob3N0OiR7cG9ydH0vYDtcbmNvbnN0IGVtYmVkVXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6NTE3NC9gO1xuXG4vLyBhY3Rpdml0eXB1Ylx1MzBFQVx1MzBBRlx1MzBBOFx1MzBCOVx1MzBDOFx1MzA2RlByb3h5XHUzMDkyXHU5MDFBXHUzMDU3XHUzMDAxXHUzMDVEXHUzMDhDXHU0RUU1XHU1OTE2XHUzMDZGVml0ZVx1MzA2RVx1OTU4Qlx1NzY3QVx1MzBCNVx1MzBGQ1x1MzBEMFx1MzBGQ1x1MzA5Mlx1OEZENFx1MzA1OVxuZnVuY3Rpb24gdmFyeUhhbmRsZXIocmVxOiBJbmNvbWluZ01lc3NhZ2UpIHtcblx0aWYgKHJlcS5oZWFkZXJzLmFjY2VwdD8uaW5jbHVkZXMoJ2FwcGxpY2F0aW9uL2FjdGl2aXR5K2pzb24nKSkge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cdHJldHVybiAnL2luZGV4Lmh0bWwnO1xufVxuXG5jb25zdCBkZXZDb25maWc6IFVzZXJDb25maWcgPSB7XG5cdC8vIFx1NTdGQVx1NjcyQ1x1MzA2RVx1OEEyRFx1NUI5QVx1MzA2RiB2aXRlLmNvbmZpZy5qcyBcdTMwNEJcdTMwODlcdTVGMTVcdTMwNERcdTdEOTlcdTMwNTBcblx0Li4uZGVmYXVsdENvbmZpZyxcblx0cm9vdDogJ3NyYycsXG5cdHB1YmxpY0RpcjogJy4uL2Fzc2V0cycsXG5cdGJhc2U6ICcuLycsXG5cdHNlcnZlcjoge1xuXHRcdGhvc3Q6ICdsb2NhbGhvc3QnLFxuXHRcdHBvcnQ6IDUxNzMsXG5cdFx0cHJveHk6IHtcblx0XHRcdCcvYXBpJzoge1xuXHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXG5cdFx0XHRcdHRhcmdldDogaHR0cFVybCxcblx0XHRcdH0sXG5cdFx0XHQnL2Fzc2V0cyc6IGh0dHBVcmwsXG5cdFx0XHQnL3N0YXRpYy1hc3NldHMnOiBodHRwVXJsLFxuXHRcdFx0Jy9jbGllbnQtYXNzZXRzJzogaHR0cFVybCxcblx0XHRcdCcvZmlsZXMnOiBodHRwVXJsLFxuXHRcdFx0Jy90d2Vtb2ppJzogaHR0cFVybCxcblx0XHRcdCcvZmx1ZW50LWVtb2ppJzogaHR0cFVybCxcblx0XHRcdCcvc3cuanMnOiBodHRwVXJsLFxuXHRcdFx0Jy9zdHJlYW1pbmcnOiB7XG5cdFx0XHRcdHRhcmdldDogd2Vic29ja2V0VXJsLFxuXHRcdFx0XHR3czogdHJ1ZSxcblx0XHRcdH0sXG5cdFx0XHQnL2Zhdmljb24uaWNvJzogaHR0cFVybCxcblx0XHRcdCcvcm9ib3RzLnR4dCc6IGh0dHBVcmwsXG5cdFx0XHQnL2VtYmVkLmpzJzogaHR0cFVybCxcblx0XHRcdCcvZW1iZWQnOiB7XG5cdFx0XHRcdHRhcmdldDogZW1iZWRVcmwsXG5cdFx0XHRcdHdzOiB0cnVlLFxuXHRcdFx0fSxcblx0XHRcdCcvaWRlbnRpY29uJzoge1xuXHRcdFx0XHR0YXJnZXQ6IGh0dHBVcmwsXG5cdFx0XHRcdHJld3JpdGUocGF0aCkge1xuXHRcdFx0XHRcdHJldHVybiBwYXRoLnJlcGxhY2UoJ0Bsb2NhbGhvc3Q6NTE3MycsICcnKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHQnL3VybCc6IGh0dHBVcmwsXG5cdFx0XHQnL3Byb3h5JzogaHR0cFVybCxcblx0XHRcdCcvX2luZm9fY2FyZF8nOiBodHRwVXJsLFxuXHRcdFx0Jy9iaW9zJzogaHR0cFVybCxcblx0XHRcdCcvY2xpJzogaHR0cFVybCxcblx0XHRcdCcvaW5ib3gnOiBodHRwVXJsLFxuXHRcdFx0Jy9lbW9qaS8nOiBodHRwVXJsLFxuXHRcdFx0Jy9ub3Rlcyc6IHtcblx0XHRcdFx0dGFyZ2V0OiBodHRwVXJsLFxuXHRcdFx0XHRieXBhc3M6IHZhcnlIYW5kbGVyLFxuXHRcdFx0fSxcblx0XHRcdCcvdXNlcnMnOiB7XG5cdFx0XHRcdHRhcmdldDogaHR0cFVybCxcblx0XHRcdFx0YnlwYXNzOiB2YXJ5SGFuZGxlcixcblx0XHRcdH0sXG5cdFx0XHQnLy53ZWxsLWtub3duJzoge1xuXHRcdFx0XHR0YXJnZXQ6IGh0dHBVcmwsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0sXG5cdGJ1aWxkOiB7XG5cdFx0Li4uZGVmYXVsdENvbmZpZy5idWlsZCxcblx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHQuLi5kZWZhdWx0Q29uZmlnLmJ1aWxkPy5yb2xsdXBPcHRpb25zLFxuXHRcdFx0aW5wdXQ6ICdpbmRleC5odG1sJyxcblx0XHR9LFxuXHR9LFxuXG5cdGRlZmluZToge1xuXHRcdC4uLmRlZmF1bHRDb25maWcuZGVmaW5lLFxuXHRcdF9MQU5HU19GVUxMXzogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmVudHJpZXMobG9jYWxlcykpLFxuXHR9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQsIG1vZGUgfSkgPT4gZGV2Q29uZmlnKTtcblxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L2xvY2FsZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvbG9jYWxlcy9pbmRleC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9taXNza2V5L2xvY2FsZXMvaW5kZXguanNcIjsvKipcbiAqIExhbmd1YWdlcyBMb2FkZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHlhbWwgZnJvbSAnanMteWFtbCc7XG5cbmNvbnN0IG1lcmdlID0gKC4uLmFyZ3MpID0+IGFyZ3MucmVkdWNlKChhLCBjKSA9PiAoe1xuXHQuLi5hLFxuXHQuLi5jLFxuXHQuLi5PYmplY3QuZW50cmllcyhhKVxuXHRcdC5maWx0ZXIoKFtrXSkgPT4gYyAmJiB0eXBlb2YgY1trXSA9PT0gJ29iamVjdCcpXG5cdFx0LnJlZHVjZSgoYSwgW2ssIHZdKSA9PiAoYVtrXSA9IG1lcmdlKHYsIGNba10pLCBhKSwge30pXG59KSwge30pO1xuXG5jb25zdCBsYW5ndWFnZXMgPSBbXG5cdCdhci1TQScsXG5cdCdjcy1DWicsXG5cdCdkYS1ESycsXG5cdCdkZS1ERScsXG5cdCdlbi1VUycsXG5cdCdlcy1FUycsXG5cdCdmci1GUicsXG5cdCdpZC1JRCcsXG5cdCdpdC1JVCcsXG5cdCdqYS1KUCcsXG5cdCdqYS1LUycsXG5cdCdrYWItS0FCJyxcblx0J2tuLUlOJyxcblx0J2tvLUtSJyxcblx0J25sLU5MJyxcblx0J25vLU5PJyxcblx0J3BsLVBMJyxcblx0J3B0LVBUJyxcblx0J3J1LVJVJyxcblx0J3NrLVNLJyxcblx0J3RoLVRIJyxcblx0J3VnLUNOJyxcblx0J3VrLVVBJyxcblx0J3ZpLVZOJyxcblx0J3poLUNOJyxcblx0J3poLVRXJyxcbl07XG5cbmNvbnN0IHByaW1hcmllcyA9IHtcblx0J2VuJzogJ1VTJyxcblx0J2phJzogJ0pQJyxcblx0J3poJzogJ0NOJyxcbn07XG5cbi8vIFx1NEY1NVx1NjU0NVx1MzA0Qlx1NjU4N1x1NUI1N1x1NTIxN1x1MzA2Qlx1MzBEMFx1MzBDM1x1MzBBRlx1MzBCOVx1MzBEQVx1MzBGQ1x1MzBCOVx1NjU4N1x1NUI1N1x1MzA0Q1x1NkRGN1x1NTE2NVx1MzA1OVx1MzA4Qlx1MzA1M1x1MzA2OFx1MzA0Q1x1MzA0Mlx1MzA4QVx1MzAwMVlBTUxcdTMwNENcdTU4Q0FcdTMwOENcdTMwOEJcdTMwNkVcdTMwNjdcdTUzRDZcdTMwOEFcdTk2NjRcdTMwNEZcbmNvbnN0IGNsZWFuID0gKHRleHQpID0+IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKFN0cmluZy5mcm9tQ29kZVBvaW50KDB4MDgpLCAnZycpLCAnJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZCgpIHtcblx0Ly8gdml0ZXN0XHUzMDZFXHU2MzE5XHU1MkQ1XHUzMDkyXHU4QUJGXHU2NTc0XHUzMDU5XHUzMDhCXHUzMDVGXHUzMDgxXHUzMDAxXHU0RTAwXHU1RUE2XHUzMEVEXHUzMEZDXHUzMEFCXHUzMEVCXHU1OTA5XHU2NTcwXHU1MzE2XHUzMDU5XHUzMDhCXHU1RkM1XHU4OTgxXHUzMDRDXHUzMDQyXHUzMDhCXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlc3QtZGV2L3ZpdGVzdC9pc3N1ZXMvMzk4OCNpc3N1ZWNvbW1lbnQtMTY4NjU5OTU3N1xuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vbWlzc2tleS1kZXYvbWlzc2tleS9wdWxsLzE0MDU3I2lzc3VlY29tbWVudC0yMTkyODMzNzg1XG5cdGNvbnN0IG1ldGFVcmwgPSBpbXBvcnQubWV0YS51cmw7XG5cdGNvbnN0IGxvY2FsZXMgPSBsYW5ndWFnZXMucmVkdWNlKChhLCBjKSA9PiAoYVtjXSA9IHlhbWwubG9hZChjbGVhbihmcy5yZWFkRmlsZVN5bmMobmV3IFVSTChgJHtjfS55bWxgLCBtZXRhVXJsKSwgJ3V0Zi04JykpKSB8fCB7fSwgYSksIHt9KTtcblxuXHQvLyBcdTdBN0FcdTY1ODdcdTVCNTdcdTUyMTdcdTMwNENcdTUxNjVcdTMwOEJcdTMwNTNcdTMwNjhcdTMwNENcdTMwNDJcdTMwOEFcdTMwMDFcdTMwRDVcdTMwQTlcdTMwRkNcdTMwRUJcdTMwRDBcdTMwQzNcdTMwQUZcdTMwNENcdTUyRDVcdTRGNUNcdTMwNTdcdTMwNkFcdTMwNEZcdTMwNkFcdTMwOEJcdTMwNkVcdTMwNjdcdTMwRDdcdTMwRURcdTMwRDFcdTMwQzZcdTMwQTNcdTMwNTRcdTMwNjhcdTZEODhcdTMwNTlcblx0Y29uc3QgcmVtb3ZlRW1wdHkgPSAob2JqKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMob2JqKSkge1xuXHRcdFx0aWYgKHYgPT09ICcnKSB7XG5cdFx0XHRcdGRlbGV0ZSBvYmpba107XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRyZW1vdmVFbXB0eSh2KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblx0cmVtb3ZlRW1wdHkobG9jYWxlcyk7XG5cblx0cmV0dXJuIE9iamVjdC5lbnRyaWVzKGxvY2FsZXMpXG5cdFx0LnJlZHVjZSgoYSwgW2ssIHZdKSA9PiAoYVtrXSA9ICgoKSA9PiB7XG5cdFx0XHRjb25zdCBbbGFuZ10gPSBrLnNwbGl0KCctJyk7XG5cdFx0XHRzd2l0Y2ggKGspIHtcblx0XHRcdFx0Y2FzZSAnamEtSlAnOiByZXR1cm4gdjtcblx0XHRcdFx0Y2FzZSAnamEtS1MnOlxuXHRcdFx0XHRjYXNlICdlbi1VUyc6IHJldHVybiBtZXJnZShsb2NhbGVzWydqYS1KUCddLCB2KTtcblx0XHRcdFx0ZGVmYXVsdDogcmV0dXJuIG1lcmdlKFxuXHRcdFx0XHRcdGxvY2FsZXNbJ2phLUpQJ10sXG5cdFx0XHRcdFx0bG9jYWxlc1snZW4tVVMnXSxcblx0XHRcdFx0XHRsb2NhbGVzW2Ake2xhbmd9LSR7cHJpbWFyaWVzW2xhbmddfWBdID8/IHt9LFxuXHRcdFx0XHRcdHZcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9KSgpLCBhKSwge30pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBidWlsZCgpO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwbHVnaW5SZXBsYWNlIGZyb20gJ0Byb2xsdXAvcGx1Z2luLXJlcGxhY2UnO1xuaW1wb3J0IHBsdWdpblZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuaW1wb3J0IHsgdHlwZSBVc2VyQ29uZmlnLCBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcblxuaW1wb3J0IGxvY2FsZXMgZnJvbSAnLi4vLi4vbG9jYWxlcy9pbmRleC5qcyc7XG5pbXBvcnQgbWV0YSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IHBhY2thZ2VJbmZvIGZyb20gJy4vcGFja2FnZS5qc29uJyB3aXRoIHsgdHlwZTogJ2pzb24nIH07XG5pbXBvcnQgcGx1Z2luVW53aW5kQ3NzTW9kdWxlQ2xhc3NOYW1lIGZyb20gJy4vbGliL3JvbGx1cC1wbHVnaW4tdW53aW5kLWNzcy1tb2R1bGUtY2xhc3MtbmFtZS5qcyc7XG5pbXBvcnQgcGx1Z2luSnNvbjUgZnJvbSAnLi92aXRlLmpzb241LmpzJztcblxuY29uc3QgZXh0ZW5zaW9ucyA9IFsnLnRzJywgJy50c3gnLCAnLmpzJywgJy5qc3gnLCAnLm1qcycsICcuanNvbicsICcuanNvbjUnLCAnLnN2ZycsICcuc2FzcycsICcuc2NzcycsICcuY3NzJywgJy52dWUnXTtcblxuLyoqXG4gKiBNaXNza2V5XHUzMDZFXHUzMEQ1XHUzMEVEXHUzMEYzXHUzMEM4XHUzMEE4XHUzMEYzXHUzMEM5XHUzMDZCXHUzMEQwXHUzMEYzXHUzMEM5XHUzMEVCXHUzMDVCXHUzMDVBXHUzMDAxQ0ROXHUzMDZBXHUzMDY5XHUzMDRCXHUzMDg5XHU1MjI1XHU5MDE0XHU4QUFEXHUzMDdGXHU4RkJDXHUzMDgwXHUzMEVBXHUzMEJEXHUzMEZDXHUzMEI5XHUzMDkyXHU4QTE4XHU4RkYwXHUzMDU5XHUzMDhCXHUzMDAyXG4gKiBDRE5cdTMwOTJcdTRGN0ZcdTMwOEZcdTMwNUFcdTMwNkJcdTMwRDBcdTMwRjNcdTMwQzlcdTMwRUJcdTMwNTdcdTMwNUZcdTMwNDRcdTU4MzRcdTU0MDhcdTMwMDFcdTRFRTVcdTRFMEJcdTMwNkVcdTkxNERcdTUyMTdcdTMwNEJcdTMwODlcdThBNzJcdTVGNTNcdTg5ODFcdTdEMjBcdTMwOTJcdTUyNEFcdTk2NjRvclx1MzBCM1x1MzBFMVx1MzBGM1x1MzBDOFx1MzBBMlx1MzBBNlx1MzBDOFx1MzA1OVx1MzA4Q1x1MzA3ME9LXG4gKi9cbmNvbnN0IGV4dGVybmFsUGFja2FnZXMgPSBbXG5cdC8vIHNoaWtpXHVGRjA4XHUzMEIzXHUzMEZDXHUzMEM5XHUzMEQ2XHUzMEVEXHUzMEMzXHUzMEFGXHUzMDZFXHUzMEI3XHUzMEYzXHUzMEJGXHUzMEMzXHUzMEFGXHUzMEI5XHUzMENGXHUzMEE0XHUzMEU5XHUzMEE0XHUzMEM4XHUzMDY3XHU0RjdGXHU3NTI4XHU0RTJEXHVGRjA5XHUzMDZGXHUzMEM2XHUzMEZDXHUzMERFXHUzMEZCXHU4QTAwXHU4QTlFXHUzMDZFXHU1QjlBXHU3RkE5XHUzMDZFXHU1QkI5XHU5MUNGXHUzMDRDXHU1OTI3XHUzMDREXHUzMDQ0XHUzMDVGXHUzMDgxXHUzMDAxXHUzMDVEXHUzMDhDXHUzMDg5XHUzMDZGQ0ROXHUzMDRCXHUzMDg5XHU4QUFEXHUzMDdGXHU4RkJDXHUzMDgwXG5cdHtcblx0XHRuYW1lOiAnc2hpa2knLFxuXHRcdG1hdGNoOiAvXnNoaWtpXFwvKD88c3ViUGtnPihsYW5nc3x0aGVtZXMpKSQvLFxuXHRcdHBhdGgoaWQ6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogc3RyaW5nIHtcblx0XHRcdGNvbnN0IG1hdGNoID0gcGF0dGVybi5leGVjKGlkKT8uZ3JvdXBzO1xuXHRcdFx0cmV0dXJuIG1hdGNoXG5cdFx0XHRcdD8gYGh0dHBzOi8vZXNtLnNoL3NoaWtpQCR7cGFja2FnZUluZm8uZGVwZW5kZW5jaWVzLnNoaWtpfS8ke21hdGNoWydzdWJQa2cnXX1gXG5cdFx0XHRcdDogaWQ7XG5cdFx0fSxcblx0fSxcbl07XG5cbmNvbnN0IGhhc2ggPSAoc3RyOiBzdHJpbmcsIHNlZWQgPSAwKTogbnVtYmVyID0+IHtcblx0bGV0IGgxID0gMHhkZWFkYmVlZiBeIHNlZWQsXG5cdFx0aDIgPSAweDQxYzZjZTU3IF4gc2VlZDtcblx0Zm9yIChsZXQgaSA9IDAsIGNoOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y2ggPSBzdHIuY2hhckNvZGVBdChpKTtcblx0XHRoMSA9IE1hdGguaW11bChoMSBeIGNoLCAyNjU0NDM1NzYxKTtcblx0XHRoMiA9IE1hdGguaW11bChoMiBeIGNoLCAxNTk3MzM0Njc3KTtcblx0fVxuXG5cdGgxID0gTWF0aC5pbXVsKGgxIF4gKGgxID4+PiAxNiksIDIyNDY4MjI1MDcpIF4gTWF0aC5pbXVsKGgyIF4gKGgyID4+PiAxMyksIDMyNjY0ODk5MDkpO1xuXHRoMiA9IE1hdGguaW11bChoMiBeIChoMiA+Pj4gMTYpLCAyMjQ2ODIyNTA3KSBeIE1hdGguaW11bChoMSBeIChoMSA+Pj4gMTMpLCAzMjY2NDg5OTA5KTtcblxuXHRyZXR1cm4gNDI5NDk2NzI5NiAqICgyMDk3MTUxICYgaDIpICsgKGgxID4+PiAwKTtcbn07XG5cbmNvbnN0IEJBU0U2Ml9ESUdJVFMgPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5mdW5jdGlvbiB0b0Jhc2U2MihuOiBudW1iZXIpOiBzdHJpbmcge1xuXHRpZiAobiA9PT0gMCkge1xuXHRcdHJldHVybiAnMCc7XG5cdH1cblx0bGV0IHJlc3VsdCA9ICcnO1xuXHR3aGlsZSAobiA+IDApIHtcblx0XHRyZXN1bHQgPSBCQVNFNjJfRElHSVRTW24gJSBCQVNFNjJfRElHSVRTLmxlbmd0aF0gKyByZXN1bHQ7XG5cdFx0biA9IE1hdGguZmxvb3IobiAvIEJBU0U2Ml9ESUdJVFMubGVuZ3RoKTtcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoKTogVXNlckNvbmZpZyB7XG5cdHJldHVybiB7XG5cdFx0YmFzZTogJy92aXRlLycsXG5cblx0XHRzZXJ2ZXI6IHtcblx0XHRcdHBvcnQ6IDUxNzMsXG5cdFx0XHRoZWFkZXJzOiB7IC8vIFx1MzA2QVx1MzA5M1x1MzA0Qlx1NTJCOVx1MzA0Qlx1MzA2QVx1MzA0NFxuXHRcdFx0XHQnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0cGx1Z2luczogW1xuXHRcdFx0cGx1Z2luVnVlKCksXG5cdFx0XHRwbHVnaW5VbndpbmRDc3NNb2R1bGVDbGFzc05hbWUoKSxcblx0XHRcdHBsdWdpbkpzb241KCksXG5cdFx0XHQuLi5wcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nXG5cdFx0XHRcdD8gW1xuXHRcdFx0XHRcdHBsdWdpblJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0cHJldmVudEFzc2lnbm1lbnQ6IHRydWUsXG5cdFx0XHRcdFx0XHR2YWx1ZXM6IHtcblx0XHRcdFx0XHRcdFx0J2lzQ2hyb21hdGljKCknOiBKU09OLnN0cmluZ2lmeShmYWxzZSksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdXG5cdFx0XHRcdDogW10sXG5cdFx0XSxcblxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGV4dGVuc2lvbnMsXG5cdFx0XHRhbGlhczoge1xuXHRcdFx0XHQnQC8nOiBfX2Rpcm5hbWUgKyAnL3NyYy8nLFxuXHRcdFx0XHQnQEAvJzogX19kaXJuYW1lICsgJy8uLi9mcm9udGVuZC1zaGFyZWQvJyxcblx0XHRcdFx0Jy9jbGllbnQtYXNzZXRzLyc6IF9fZGlybmFtZSArICcvYXNzZXRzLycsXG5cdFx0XHRcdCcvc3RhdGljLWFzc2V0cy8nOiBfX2Rpcm5hbWUgKyAnLy4uL2JhY2tlbmQvYXNzZXRzLycsXG5cdFx0XHRcdCcvZmx1ZW50LWVtb2ppcy8nOiBfX2Rpcm5hbWUgKyAnLy4uLy4uL2ZsdWVudC1lbW9qaXMvZGlzdC8nLFxuXHRcdFx0XHQnL2ZsdWVudC1lbW9qaS8nOiBfX2Rpcm5hbWUgKyAnLy4uLy4uL2ZsdWVudC1lbW9qaXMvZGlzdC8nLFxuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0Y3NzOiB7XG5cdFx0XHRtb2R1bGVzOiB7XG5cdFx0XHRcdGdlbmVyYXRlU2NvcGVkTmFtZShuYW1lLCBmaWxlbmFtZSwgX2Nzcyk6IHN0cmluZyB7XG5cdFx0XHRcdFx0Y29uc3QgaWQgPSAocGF0aC5yZWxhdGl2ZShfX2Rpcm5hbWUsIGZpbGVuYW1lLnNwbGl0KCc/JylbMF0pICsgJy0nICsgbmFtZSkucmVwbGFjZSgvW1xcXFxcXC9cXC5cXD8mPV0vZywgJy0nKS5yZXBsYWNlKC8oc3JjLXx2dWUtKS9nLCAnJyk7XG5cdFx0XHRcdFx0aWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcblx0XHRcdFx0XHRcdHJldHVybiAneCcgKyB0b0Jhc2U2MihoYXNoKGlkKSkuc3Vic3RyaW5nKDAsIDQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0ZGVmaW5lOiB7XG5cdFx0XHRfVkVSU0lPTl86IEpTT04uc3RyaW5naWZ5KG1ldGEudmVyc2lvbiksXG5cdFx0XHRfTEFOR1NfOiBKU09OLnN0cmluZ2lmeShPYmplY3QuZW50cmllcyhsb2NhbGVzKS5tYXAoKFtrLCB2XSkgPT4gW2ssIHYuX2xhbmdfXSkpLFxuXHRcdFx0X0VOVl86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WKSxcblx0XHRcdF9ERVZfOiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nLFxuXHRcdFx0X1BFUkZfUFJFRklYXzogSlNPTi5zdHJpbmdpZnkoJ01pc3NrZXk6JyksXG5cdFx0XHRfREFUQV9UUkFOU0ZFUl9EUklWRV9GSUxFXzogSlNPTi5zdHJpbmdpZnkoJ21rX2RyaXZlX2ZpbGUnKSxcblx0XHRcdF9EQVRBX1RSQU5TRkVSX0RSSVZFX0ZPTERFUl86IEpTT04uc3RyaW5naWZ5KCdta19kcml2ZV9mb2xkZXInKSxcblx0XHRcdF9EQVRBX1RSQU5TRkVSX0RFQ0tfQ09MVU1OXzogSlNPTi5zdHJpbmdpZnkoJ21rX2RlY2tfY29sdW1uJyksXG5cdFx0XHRfX1ZVRV9PUFRJT05TX0FQSV9fOiB0cnVlLFxuXHRcdFx0X19WVUVfUFJPRF9ERVZUT09MU19fOiBmYWxzZSxcblx0XHR9LFxuXG5cdFx0YnVpbGQ6IHtcblx0XHRcdHRhcmdldDogW1xuXHRcdFx0XHQnY2hyb21lMTE2Jyxcblx0XHRcdFx0J2ZpcmVmb3gxMTYnLFxuXHRcdFx0XHQnc2FmYXJpMTYnLFxuXHRcdFx0XSxcblx0XHRcdG1hbmlmZXN0OiAnbWFuaWZlc3QuanNvbicsXG5cdFx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHRcdGlucHV0OiB7XG5cdFx0XHRcdFx0YXBwOiAnLi9zcmMvX2Jvb3RfLnRzJyxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXh0ZXJuYWw6IGV4dGVybmFsUGFja2FnZXMubWFwKHAgPT4gcC5tYXRjaCksXG5cdFx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHRcdG1hbnVhbENodW5rczoge1xuXHRcdFx0XHRcdFx0dnVlOiBbJ3Z1ZSddLFxuXHRcdFx0XHRcdFx0cGhvdG9zd2lwZTogWydwaG90b3N3aXBlJywgJ3Bob3Rvc3dpcGUvbGlnaHRib3gnLCAncGhvdG9zd2lwZS9zdHlsZS5jc3MnXSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNodW5rRmlsZU5hbWVzOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJ1toYXNoOjhdLmpzJyA6ICdbbmFtZV0tW2hhc2g6OF0uanMnLFxuXHRcdFx0XHRcdGFzc2V0RmlsZU5hbWVzOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJ1toYXNoOjhdW2V4dG5hbWVdJyA6ICdbbmFtZV0tW2hhc2g6OF1bZXh0bmFtZV0nLFxuXHRcdFx0XHRcdHBhdGhzKGlkKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHAgb2YgZXh0ZXJuYWxQYWNrYWdlcykge1xuXHRcdFx0XHRcdFx0XHRpZiAocC5tYXRjaC50ZXN0KGlkKSkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBwLnBhdGgoaWQsIHAubWF0Y2gpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBpZDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdGNzc0NvZGVTcGxpdDogdHJ1ZSxcblx0XHRcdG91dERpcjogX19kaXJuYW1lICsgJy8uLi8uLi9idWlsdC9fZnJvbnRlbmRfdml0ZV8nLFxuXHRcdFx0YXNzZXRzRGlyOiAnLicsXG5cdFx0XHRlbXB0eU91dERpcjogZmFsc2UsXG5cdFx0XHRzb3VyY2VtYXA6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxuXHRcdFx0cmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuXG5cdFx0XHQvLyBodHRwczovL3ZpdGVqcy5kZXYvZ3VpZGUvZGVwLXByZS1idW5kbGluZy5odG1sI21vbm9yZXBvcy1hbmQtbGlua2VkLWRlcGVuZGVuY2llc1xuXHRcdFx0Y29tbW9uanNPcHRpb25zOiB7XG5cdFx0XHRcdGluY2x1ZGU6IFsvbWlzc2tleS1qcy8sIC9taXNza2V5LXJldmVyc2kvLCAvbWlzc2tleS1idWJibGUtZ2FtZS8sIC9ub2RlX21vZHVsZXMvXSxcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdHdvcmtlcjoge1xuXHRcdFx0Zm9ybWF0OiAnZXMnLFxuXHRcdH0sXG5cblx0XHR0ZXN0OiB7XG5cdFx0XHRlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXG5cdFx0XHRkZXBzOiB7XG5cdFx0XHRcdG9wdGltaXplcjoge1xuXHRcdFx0XHRcdHdlYjoge1xuXHRcdFx0XHRcdFx0aW5jbHVkZTogW1xuXHRcdFx0XHRcdFx0XHQvLyBYWFg6IG1pc3NrZXktZGV2L2Jyb3dzZXItaW1hZ2UtcmVzaXplciBoYXMgbm8gXCJ0eXBlXCI6IFwibW9kdWxlXCJcblx0XHRcdFx0XHRcdFx0J2Jyb3dzZXItaW1hZ2UtcmVzaXplcicsXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZVNvdXJjZTogWydzcmMvKiovKi50cyddLFxuXHRcdH0sXG5cdH07XG59XG5cbmNvbnN0IGNvbmZpZyA9IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IGdldENvbmZpZygpKTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xuIiwgIntcblx0XCJuYW1lXCI6IFwibWlzc2tleVwiLFxuXHRcInZlcnNpb25cIjogXCIyMDI0LjkuMC1zaGFodS4xLjQuMFwiLFxuXHRcImNvZGVuYW1lXCI6IFwibmFzdWJpXCIsXG5cdFwicmVwb3NpdG9yeVwiOiB7XG5cdFx0XCJ0eXBlXCI6IFwiZ2l0XCIsXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vdGVhbS1zaGFodS9taXNza2V5XCJcblx0fSxcblx0XCJwYWNrYWdlTWFuYWdlclwiOiBcInBucG1AOS42LjBcIixcblx0XCJ3b3Jrc3BhY2VzXCI6IFtcblx0XHRcInBhY2thZ2VzL2Zyb250ZW5kLXNoYXJlZFwiLFxuXHRcdFwicGFja2FnZXMvZnJvbnRlbmRcIixcblx0XHRcInBhY2thZ2VzL2Zyb250ZW5kLWVtYmVkXCIsXG5cdFx0XCJwYWNrYWdlcy9iYWNrZW5kXCIsXG5cdFx0XCJwYWNrYWdlcy9zd1wiLFxuXHRcdFwicGFja2FnZXMvbWlzc2tleS1qc1wiLFxuXHRcdFwicGFja2FnZXMvbWlzc2tleS1yZXZlcnNpXCIsXG5cdFx0XCJwYWNrYWdlcy9taXNza2V5LWJ1YmJsZS1nYW1lXCJcblx0XSxcblx0XCJwcml2YXRlXCI6IHRydWUsXG5cdFwic2NyaXB0c1wiOiB7XG5cdFx0XCJidWlsZC1wcmVcIjogXCJub2RlIC4vc2NyaXB0cy9idWlsZC1wcmUuanNcIixcblx0XHRcImJ1aWxkLWFzc2V0c1wiOiBcIm5vZGUgLi9zY3JpcHRzL2J1aWxkLWFzc2V0cy5tanNcIixcblx0XHRcImJ1aWxkXCI6IFwicG5wbSBidWlsZC1wcmUgJiYgcG5wbSAtciBidWlsZCAmJiBwbnBtIGJ1aWxkLWFzc2V0c1wiLFxuXHRcdFwiYnVpbGQtc3Rvcnlib29rXCI6IFwicG5wbSAtLWZpbHRlciBmcm9udGVuZCBidWlsZC1zdG9yeWJvb2tcIixcblx0XHRcImJ1aWxkLW1pc3NrZXktanMtd2l0aC10eXBlc1wiOiBcInBucG0gYnVpbGQtcHJlICYmIHBucG0gLS1maWx0ZXIgYmFja2VuZC4uLiAtLWZpbHRlcj0hbWlzc2tleS1qcyBidWlsZCAmJiBwbnBtIC0tZmlsdGVyIGJhY2tlbmQgZ2VuZXJhdGUtYXBpLWpzb24gLS1uby1idWlsZCAmJiBuY3AgcGFja2FnZXMvYmFja2VuZC9idWlsdC9hcGkuanNvbiBwYWNrYWdlcy9taXNza2V5LWpzL2dlbmVyYXRvci9hcGkuanNvbiAmJiBwbnBtIC0tZmlsdGVyIG1pc3NrZXktanMgdXBkYXRlLWF1dG9nZW4tY29kZSAmJiBwbnBtIC0tZmlsdGVyIG1pc3NrZXktanMgYnVpbGQgJiYgcG5wbSAtLWZpbHRlciBtaXNza2V5LWpzIGFwaVwiLFxuXHRcdFwic3RhcnRcIjogXCJwbnBtIGNoZWNrOmNvbm5lY3QgJiYgY2QgcGFja2FnZXMvYmFja2VuZCAmJiBub2RlIC4vYnVpbHQvYm9vdC9lbnRyeS5qc1wiLFxuXHRcdFwic3RhcnQ6dGVzdFwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgY3Jvc3MtZW52IE5PREVfRU5WPXRlc3Qgbm9kZSAuL2J1aWx0L2Jvb3QvZW50cnkuanNcIixcblx0XHRcImluaXRcIjogXCJwbnBtIG1pZ3JhdGVcIixcblx0XHRcIm1pZ3JhdGVcIjogXCJjZCBwYWNrYWdlcy9iYWNrZW5kICYmIHBucG0gbWlncmF0ZVwiLFxuXHRcdFwicmV2ZXJ0XCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBwbnBtIHJldmVydFwiLFxuXHRcdFwiY2hlY2s6Y29ubmVjdFwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgcG5wbSBjaGVjazpjb25uZWN0XCIsXG5cdFx0XCJtaWdyYXRlYW5kc3RhcnRcIjogXCJwbnBtIG1pZ3JhdGUgJiYgcG5wbSBzdGFydFwiLFxuXHRcdFwid2F0Y2hcIjogXCJwbnBtIGRldlwiLFxuXHRcdFwiZGV2XCI6IFwibm9kZSBzY3JpcHRzL2Rldi5tanNcIixcblx0XHRcImxpbnRcIjogXCJwbnBtIC1yIGxpbnRcIixcblx0XHRcImN5Om9wZW5cIjogXCJwbnBtIGN5cHJlc3Mgb3BlbiAtLWJyb3dzZXIgLS1lMmUgLS1jb25maWctZmlsZT1jeXByZXNzLmNvbmZpZy50c1wiLFxuXHRcdFwiY3k6cnVuXCI6IFwicG5wbSBjeXByZXNzIHJ1blwiLFxuXHRcdFwiZTJlXCI6IFwicG5wbSBzdGFydC1zZXJ2ZXItYW5kLXRlc3Qgc3RhcnQ6dGVzdCBodHRwOi8vbG9jYWxob3N0OjYxODEyIGN5OnJ1blwiLFxuXHRcdFwiZTJlLWRldi1jb250YWluZXJcIjogXCJjcCAuLy5jb25maWcvY3lwcmVzcy1kZXZjb250YWluZXIueW1sIC4vLmNvbmZpZy90ZXN0LnltbCAmJiBwbnBtIHN0YXJ0LXNlcnZlci1hbmQtdGVzdCBzdGFydDp0ZXN0IGh0dHA6Ly9sb2NhbGhvc3Q6NjE4MTIgY3k6cnVuXCIsXG5cdFx0XCJqZXN0XCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBwbnBtIGplc3RcIixcblx0XHRcImplc3QtYW5kLWNvdmVyYWdlXCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBwbnBtIGplc3QtYW5kLWNvdmVyYWdlXCIsXG5cdFx0XCJ0ZXN0XCI6IFwicG5wbSAtciB0ZXN0XCIsXG5cdFx0XCJ0ZXN0LWFuZC1jb3ZlcmFnZVwiOiBcInBucG0gLXIgdGVzdC1hbmQtY292ZXJhZ2VcIixcblx0XHRcImNsZWFuXCI6IFwibm9kZSAuL3NjcmlwdHMvY2xlYW4uanNcIixcblx0XHRcImNsZWFuLWFsbFwiOiBcIm5vZGUgLi9zY3JpcHRzL2NsZWFuLWFsbC5qc1wiLFxuXHRcdFwiY2xlYW5hbGxcIjogXCJwbnBtIGNsZWFuLWFsbFwiXG5cdH0sXG5cdFwicmVzb2x1dGlvbnNcIjoge1xuXHRcdFwiY2hva2lkYXJcIjogXCIzLjUuM1wiLFxuXHRcdFwibG9kYXNoXCI6IFwiNC4xNy4yMVwiXG5cdH0sXG5cdFwiZGVwZW5kZW5jaWVzXCI6IHtcblx0XHRcIkBpc2FhY3MvdHRsY2FjaGVcIjogXCJeMS40LjFcIixcblx0XHRcImNzc25hbm9cIjogXCI2LjEuMlwiLFxuXHRcdFwiZXhlY2FcIjogXCI4LjAuMVwiLFxuXHRcdFwiZmFzdC1nbG9iXCI6IFwiMy4zLjJcIixcblx0XHRcImlnbm9yZS13YWxrXCI6IFwiNi4wLjVcIixcblx0XHRcImpzLXlhbWxcIjogXCI0LjEuMFwiLFxuXHRcdFwicG9zdGNzc1wiOiBcIjguNC40N1wiLFxuXHRcdFwidGFyXCI6IFwiNi4yLjFcIixcblx0XHRcInRlcnNlclwiOiBcIjUuMzMuMFwiLFxuXHRcdFwidHlwZXNjcmlwdFwiOiBcIjUuNi4yXCIsXG5cdFx0XCJlc2J1aWxkXCI6IFwiMC4yMy4xXCIsXG5cdFx0XCJnbG9iXCI6IFwiMTEuMC4wXCJcblx0fSxcblx0XCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuXHRcdFwiQG1pc3NrZXktZGV2L2VzbGludC1wbHVnaW5cIjogXCIyLjAuM1wiLFxuXHRcdFwiQHR5cGVzL25vZGVcIjogXCIyMC4xNC4xMlwiLFxuXHRcdFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCI3LjE3LjBcIixcblx0XHRcIkB0eXBlc2NyaXB0LWVzbGludC9wYXJzZXJcIjogXCI3LjE3LjBcIixcblx0XHRcImNyb3NzLWVudlwiOiBcIjcuMC4zXCIsXG5cdFx0XCJjeXByZXNzXCI6IFwiMTMuMTQuMlwiLFxuXHRcdFwiZXNsaW50XCI6IFwiOS44LjBcIixcblx0XHRcImdsb2JhbHNcIjogXCIxNS45LjBcIixcblx0XHRcIm5jcFwiOiBcIjIuMC4wXCIsXG5cdFx0XCJzdGFydC1zZXJ2ZXItYW5kLXRlc3RcIjogXCIyLjAuOFwiXG5cdH0sXG5cdFwib3B0aW9uYWxEZXBlbmRlbmNpZXNcIjoge1xuXHRcdFwiQHRlbnNvcmZsb3cvdGZqcy1jb3JlXCI6IFwiNC40LjBcIlxuXHR9XG59XG4iLCAie1xuXHRcIm5hbWVcIjogXCJmcm9udGVuZFwiLFxuXHRcInByaXZhdGVcIjogdHJ1ZSxcblx0XCJ0eXBlXCI6IFwibW9kdWxlXCIsXG5cdFwic2NyaXB0c1wiOiB7XG5cdFx0XCJ3YXRjaFwiOiBcInZpdGVcIixcblx0XHRcImRldlwiOiBcInZpdGUgLS1jb25maWcgdml0ZS5jb25maWcubG9jYWwtZGV2LnRzIC0tZGVidWcgaG1yXCIsXG5cdFx0XCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcblx0XHRcInN0b3J5Ym9vay1kZXZcIjogXCJub2RlbW9uIC0tdmVyYm9zZSAtLXdhdGNoIHNyYyAtLWV4dCBcXFwibWR4LHRzLHZ1ZVxcXCIgLS1pZ25vcmUgXFxcIiouc3Rvcmllcy50c1xcXCIgLS1leGVjIFxcXCJwbnBtIGJ1aWxkLXN0b3J5Ym9vay1wcmUgJiYgcG5wbSBleGVjIHN0b3J5Ym9vayBkZXYgLXAgNjAwNiAtLWNpXFxcIlwiLFxuXHRcdFwiYnVpbGQtc3Rvcnlib29rLXByZVwiOiBcIih0c2MgLXAgLnN0b3J5Ym9vayB8fCBlY2hvIGRvbmUuKSAmJiBub2RlIC5zdG9yeWJvb2svZ2VuZXJhdGUuanMgJiYgbm9kZSAuc3Rvcnlib29rL3ByZWxvYWQtbG9jYWxlLmpzICYmIG5vZGUgLnN0b3J5Ym9vay9wcmVsb2FkLXRoZW1lLmpzXCIsXG5cdFx0XCJidWlsZC1zdG9yeWJvb2tcIjogXCJwbnBtIGJ1aWxkLXN0b3J5Ym9vay1wcmUgJiYgc3Rvcnlib29rIGJ1aWxkIC0td2VicGFjay1zdGF0cy1qc29uIHN0b3J5Ym9vay1zdGF0aWNcIixcblx0XHRcImNocm9tYXRpY1wiOiBcImNocm9tYXRpY1wiLFxuXHRcdFwidGVzdFwiOiBcInZpdGVzdCAtLXJ1biAtLWdsb2JhbHNcIixcblx0XHRcInRlc3QtYW5kLWNvdmVyYWdlXCI6IFwidml0ZXN0IC0tcnVuIC0tY292ZXJhZ2UgLS1nbG9iYWxzXCIsXG5cdFx0XCJ0eXBlY2hlY2tcIjogXCJ2dWUtdHNjIC0tbm9FbWl0XCIsXG5cdFx0XCJlc2xpbnRcIjogXCJlc2xpbnQgLS1xdWlldCBcXFwic3JjLyoqLyoue3RzLHZ1ZX1cXFwiXCIsXG5cdFx0XCJsaW50XCI6IFwicG5wbSB0eXBlY2hlY2sgJiYgcG5wbSBlc2xpbnRcIlxuXHR9LFxuXHRcImRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAZGlzY29yZGFwcC90d2Vtb2ppXCI6IFwiMTUuMS4wXCIsXG5cdFx0XCJAZ2l0aHViL3dlYmF1dGhuLWpzb25cIjogXCIyLjEuMVwiLFxuXHRcdFwiQG1jYXB0Y2hhL3ZhbmlsbGEtZ2x1ZVwiOiBcIjAuMS4wLWFscGhhLTNcIixcblx0XHRcIkBtaXNza2V5LWRldi9icm93c2VyLWltYWdlLXJlc2l6ZXJcIjogXCIyMDI0LjEuMFwiLFxuXHRcdFwiQHJvbGx1cC9wbHVnaW4tanNvblwiOiBcIjYuMS4wXCIsXG5cdFx0XCJAcm9sbHVwL3BsdWdpbi1yZXBsYWNlXCI6IFwiNS4wLjdcIixcblx0XHRcIkByb2xsdXAvcGx1Z2ludXRpbHNcIjogXCI1LjEuMlwiLFxuXHRcdFwiQHN5dWlsby9haXNjcmlwdFwiOiBcIjAuMTkuMFwiLFxuXHRcdFwiQHRhYmxlci9pY29ucy13ZWJmb250XCI6IFwiMy4zLjBcIixcblx0XHRcIkB0d2Vtb2ppL3BhcnNlclwiOiBcIjE1LjEuMVwiLFxuXHRcdFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI6IFwiNS4xLjRcIixcblx0XHRcIkB2dWUvY29tcGlsZXItc2ZjXCI6IFwiMy41LjEwXCIsXG5cdFx0XCJhaXNjcmlwdC12c2NvZGVcIjogXCJnaXRodWI6YWlzY3JpcHQtZGV2L2Fpc2NyaXB0LXZzY29kZSN2MC4xLjExXCIsXG5cdFx0XCJhc3RyaW5nXCI6IFwiMS45LjBcIixcblx0XHRcImJyb2FkY2FzdC1jaGFubmVsXCI6IFwiNy4wLjBcIixcblx0XHRcImJ1cmFoYVwiOiBcIjAuMC4xXCIsXG5cdFx0XCJjYW52YXMtY29uZmV0dGlcIjogXCIxLjkuM1wiLFxuXHRcdFwiY2hhcnQuanNcIjogXCI0LjQuNFwiLFxuXHRcdFwiY2hhcnRqcy1hZGFwdGVyLWRhdGUtZm5zXCI6IFwiMy4wLjBcIixcblx0XHRcImNoYXJ0anMtY2hhcnQtbWF0cml4XCI6IFwiMi4wLjFcIixcblx0XHRcImNoYXJ0anMtcGx1Z2luLWdyYWRpZW50XCI6IFwiMC42LjFcIixcblx0XHRcImNoYXJ0anMtcGx1Z2luLXpvb21cIjogXCIyLjAuMVwiLFxuXHRcdFwiY2hyb21hdGljXCI6IFwiMTEuMTAuNFwiLFxuXHRcdFwiY29tcGFyZS12ZXJzaW9uc1wiOiBcIjYuMS4xXCIsXG5cdFx0XCJjcm9wcGVyanNcIjogXCIyLjAuMC1yYy4yXCIsXG5cdFx0XCJkYXRlLWZuc1wiOiBcIjIuMzAuMFwiLFxuXHRcdFwiZXN0cmVlLXdhbGtlclwiOiBcIjMuMC4zXCIsXG5cdFx0XCJldmVudGVtaXR0ZXIzXCI6IFwiNS4wLjFcIixcblx0XHRcImlkYi1rZXl2YWxcIjogXCI2LjIuMVwiLFxuXHRcdFwiaW5zZXJ0LXRleHQtYXQtY3Vyc29yXCI6IFwiMC4zLjBcIixcblx0XHRcImlzLWZpbGUtYW5pbWF0ZWRcIjogXCIxLjAuMlwiLFxuXHRcdFwianNvbjVcIjogXCIyLjIuM1wiLFxuXHRcdFwibWF0dGVyLWpzXCI6IFwiMC4xOS4wXCIsXG5cdFx0XCJtZm0tanNcIjogXCIwLjI0LjBcIixcblx0XHRcIm1pc3NrZXktYnViYmxlLWdhbWVcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuXHRcdFwibWlzc2tleS1qc1wiOiBcIndvcmtzcGFjZToqXCIsXG5cdFx0XCJtaXNza2V5LXJldmVyc2lcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuXHRcdFwiZnJvbnRlbmQtc2hhcmVkXCI6IFwid29ya3NwYWNlOipcIixcblx0XHRcInBob3Rvc3dpcGVcIjogXCI1LjQuNFwiLFxuXHRcdFwicHVueWNvZGVcIjogXCIyLjMuMVwiLFxuXHRcdFwicm9sbHVwXCI6IFwiNC4yMi41XCIsXG5cdFx0XCJzYW5pdGl6ZS1odG1sXCI6IFwiMi4xMy4wXCIsXG5cdFx0XCJzYXNzXCI6IFwiMS43OS4zXCIsXG5cdFx0XCJzaGlraVwiOiBcIjEuMTIuMFwiLFxuXHRcdFwic3RyaWN0LWV2ZW50LWVtaXR0ZXItdHlwZXNcIjogXCIyLjAuMFwiLFxuXHRcdFwidGV4dGFyZWEtY2FyZXRcIjogXCIzLjEuMFwiLFxuXHRcdFwidGhyZWVcIjogXCIwLjE2OS4wXCIsXG5cdFx0XCJ0aHJvdHRsZS1kZWJvdW5jZVwiOiBcIjUuMC4yXCIsXG5cdFx0XCJ0aW55Y29sb3IyXCI6IFwiMS42LjBcIixcblx0XHRcInRzYy1hbGlhc1wiOiBcIjEuOC4xMFwiLFxuXHRcdFwidHNjb25maWctcGF0aHNcIjogXCI0LjIuMFwiLFxuXHRcdFwidHlwZXNjcmlwdFwiOiBcIjUuNi4yXCIsXG5cdFx0XCJ1dWlkXCI6IFwiMTAuMC4wXCIsXG5cdFx0XCJ2LWNvZGUtZGlmZlwiOiBcIjEuMTMuMVwiLFxuXHRcdFwidml0ZVwiOiBcIjUuNC44XCIsXG5cdFx0XCJ2dWVcIjogXCIzLjUuMTBcIixcblx0XHRcInZ1ZWRyYWdnYWJsZVwiOiBcIm5leHRcIlxuXHR9LFxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAbWlzc2tleS1kZXYvc3VtbWFseVwiOiBcIjUuMS4wXCIsXG5cdFx0XCJAc3Rvcnlib29rL2FkZG9uLWFjdGlvbnNcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9hZGRvbi1lc3NlbnRpYWxzXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svYWRkb24taW50ZXJhY3Rpb25zXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svYWRkb24tbGlua3NcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9hZGRvbi1tZHgtZ2ZtXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svYWRkb24tc3Rvcnlzb3VyY2VcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9ibG9ja3NcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9jb21wb25lbnRzXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svY29yZS1ldmVudHNcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9tYW5hZ2VyLWFwaVwiOiBcIjguMy4zXCIsXG5cdFx0XCJAc3Rvcnlib29rL3ByZXZpZXctYXBpXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svcmVhY3RcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay9yZWFjdC12aXRlXCI6IFwiOC4zLjNcIixcblx0XHRcIkBzdG9yeWJvb2svdGVzdFwiOiBcIjguMy4zXCIsXG5cdFx0XCJAc3Rvcnlib29rL3RoZW1pbmdcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay90eXBlc1wiOiBcIjguMy4zXCIsXG5cdFx0XCJAc3Rvcnlib29rL3Z1ZTNcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHN0b3J5Ym9vay92dWUzLXZpdGVcIjogXCI4LjMuM1wiLFxuXHRcdFwiQHRlc3RpbmctbGlicmFyeS92dWVcIjogXCI4LjEuMFwiLFxuXHRcdFwiQHR5cGVzL2VzdHJlZVwiOiBcIjEuMC42XCIsXG5cdFx0XCJAdHlwZXMvbWF0dGVyLWpzXCI6IFwiMC4xOS43XCIsXG5cdFx0XCJAdHlwZXMvbWljcm9tYXRjaFwiOiBcIjQuMC45XCIsXG5cdFx0XCJAdHlwZXMvbm9kZVwiOiBcIjIwLjE0LjEyXCIsXG5cdFx0XCJAdHlwZXMvcHVueWNvZGVcIjogXCIyLjEuNFwiLFxuXHRcdFwiQHR5cGVzL3Nhbml0aXplLWh0bWxcIjogXCIyLjEzLjBcIixcblx0XHRcIkB0eXBlcy9zZWVkcmFuZG9tXCI6IFwiMy4wLjhcIixcblx0XHRcIkB0eXBlcy90aHJvdHRsZS1kZWJvdW5jZVwiOiBcIjUuMC4yXCIsXG5cdFx0XCJAdHlwZXMvdGlueWNvbG9yMlwiOiBcIjEuNC42XCIsXG5cdFx0XCJAdHlwZXMvdXVpZFwiOiBcIjEwLjAuMFwiLFxuXHRcdFwiQHR5cGVzL3dzXCI6IFwiOC41LjEyXCIsXG5cdFx0XCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiQHZpdGVzdC9jb3ZlcmFnZS12OFwiOiBcIjEuNi4wXCIsXG5cdFx0XCJAdnVlL3J1bnRpbWUtY29yZVwiOiBcIjMuNS4xMFwiLFxuXHRcdFwiYWNvcm5cIjogXCI4LjEyLjFcIixcblx0XHRcImNyb3NzLWVudlwiOiBcIjcuMC4zXCIsXG5cdFx0XCJjeXByZXNzXCI6IFwiMTMuMTUuMFwiLFxuXHRcdFwiZXNsaW50LXBsdWdpbi1pbXBvcnRcIjogXCIyLjMwLjBcIixcblx0XHRcImVzbGludC1wbHVnaW4tdnVlXCI6IFwiOS4yOC4wXCIsXG5cdFx0XCJmYXN0LWdsb2JcIjogXCIzLjMuMlwiLFxuXHRcdFwiaGFwcHktZG9tXCI6IFwiMTAuMC4zXCIsXG5cdFx0XCJpbnRlcnNlY3Rpb24tb2JzZXJ2ZXJcIjogXCIwLjEyLjJcIixcblx0XHRcIm1pY3JvbWF0Y2hcIjogXCI0LjAuOFwiLFxuXHRcdFwibXN3XCI6IFwiMi40LjlcIixcblx0XHRcIm1zdy1zdG9yeWJvb2stYWRkb25cIjogXCIyLjAuM1wiLFxuXHRcdFwibm9kZW1vblwiOiBcIjMuMS43XCIsXG5cdFx0XCJwcmV0dGllclwiOiBcIjMuMy4zXCIsXG5cdFx0XCJyZWFjdFwiOiBcIjE4LjMuMVwiLFxuXHRcdFwicmVhY3QtZG9tXCI6IFwiMTguMy4xXCIsXG5cdFx0XCJzZWVkcmFuZG9tXCI6IFwiMy4wLjVcIixcblx0XHRcInN0YXJ0LXNlcnZlci1hbmQtdGVzdFwiOiBcIjIuMC44XCIsXG5cdFx0XCJzdG9yeWJvb2tcIjogXCI4LjMuM1wiLFxuXHRcdFwic3Rvcnlib29rLWFkZG9uLW1pc3NrZXktdGhlbWVcIjogXCJnaXRodWI6bWlzc2tleS1kZXYvc3Rvcnlib29rLWFkZG9uLW1pc3NrZXktdGhlbWVcIixcblx0XHRcInZpdGUtcGx1Z2luLXR1cmJvc25hcFwiOiBcIjEuMC4zXCIsXG5cdFx0XCJ2aXRlc3RcIjogXCIxLjYuMFwiLFxuXHRcdFwidml0ZXN0LWZldGNoLW1vY2tcIjogXCIwLjIuMlwiLFxuXHRcdFwidnVlLWNvbXBvbmVudC10eXBlLWhlbHBlcnNcIjogXCIyLjEuNlwiLFxuXHRcdFwidnVlLWVzbGludC1wYXJzZXJcIjogXCI5LjQuM1wiLFxuXHRcdFwidnVlLXRzY1wiOiBcIjIuMS42XCJcblx0fVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kL2xpYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC9saWIvcm9sbHVwLXBsdWdpbi11bndpbmQtY3NzLW1vZHVsZS1jbGFzcy1uYW1lLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmQvbGliL3JvbGx1cC1wbHVnaW4tdW53aW5kLWNzcy1tb2R1bGUtY2xhc3MtbmFtZS50c1wiOy8qXG4gKiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiBzeXVpbG8gYW5kIG1pc3NrZXktcHJvamVjdFxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9ubHlcbiAqL1xuXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ2FzdHJpbmcnO1xuaW1wb3J0ICogYXMgZXN0cmVlIGZyb20gJ2VzdHJlZSc7XG5pbXBvcnQgeyB3YWxrIH0gZnJvbSAnLi4vbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL2luZGV4LmpzJztcbmltcG9ydCB0eXBlICogYXMgZXN0cmVlV2Fsa2VyIGZyb20gJ2VzdHJlZS13YWxrZXInO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJztcblxuZnVuY3Rpb24gaXNGYWxzeUlkZW50aWZpZXIoaWRlbnRpZmllcjogZXN0cmVlLklkZW50aWZpZXIpOiBib29sZWFuIHtcblx0cmV0dXJuIGlkZW50aWZpZXIubmFtZSA9PT0gJ3VuZGVmaW5lZCcgfHwgaWRlbnRpZmllci5uYW1lID09PSAnTmFOJztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3NXYWxrZXIodHJlZTogZXN0cmVlLk5vZGUsIHN0YWNrOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcblx0aWYgKHRyZWUudHlwZSA9PT0gJ0lkZW50aWZpZXInKSByZXR1cm4gaXNGYWxzeUlkZW50aWZpZXIodHJlZSkgPyAnJyA6IG51bGw7XG5cdGlmICh0cmVlLnR5cGUgPT09ICdMaXRlcmFsJykgcmV0dXJuIHR5cGVvZiB0cmVlLnZhbHVlID09PSAnc3RyaW5nJyA/IHRyZWUudmFsdWUgOiAnJztcblx0aWYgKHRyZWUudHlwZSA9PT0gJ0JpbmFyeUV4cHJlc3Npb24nKSB7XG5cdFx0aWYgKHRyZWUub3BlcmF0b3IgIT09ICcrJykgcmV0dXJuIG51bGw7XG5cdFx0Y29uc3QgbGVmdCA9IG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWUubGVmdCwgc3RhY2spO1xuXHRcdGNvbnN0IHJpZ2h0ID0gbm9ybWFsaXplQ2xhc3NXYWxrZXIodHJlZS5yaWdodCwgc3RhY2spO1xuXHRcdGlmIChsZWZ0ID09PSBudWxsIHx8IHJpZ2h0ID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0XHRyZXR1cm4gYCR7bGVmdH0ke3JpZ2h0fWA7XG5cdH1cblx0aWYgKHRyZWUudHlwZSA9PT0gJ1RlbXBsYXRlTGl0ZXJhbCcpIHtcblx0XHRpZiAodHJlZS5leHByZXNzaW9ucy5zb21lKCh4KSA9PiB4LnR5cGUgIT09ICdMaXRlcmFsJyAmJiAoeC50eXBlICE9PSAnSWRlbnRpZmllcicgfHwgIWlzRmFsc3lJZGVudGlmaWVyKHgpKSkpIHJldHVybiBudWxsO1xuXHRcdHJldHVybiB0cmVlLnF1YXNpcy5yZWR1Y2UoKGEsIGMsIGkpID0+IHtcblx0XHRcdGNvbnN0IHYgPSBpID09PSB0cmVlLnF1YXNpcy5sZW5ndGggLSAxID8gJycgOiAodHJlZS5leHByZXNzaW9uc1tpXSBhcyBQYXJ0aWFsPGVzdHJlZS5MaXRlcmFsPikudmFsdWU7XG5cdFx0XHRyZXR1cm4gYSArIGMudmFsdWUucmF3ICsgKHR5cGVvZiB2ID09PSAnc3RyaW5nJyA/IHYgOiAnJyk7XG5cdFx0fSwgJycpO1xuXHR9XG5cdGlmICh0cmVlLnR5cGUgPT09ICdBcnJheUV4cHJlc3Npb24nKSB7XG5cdFx0Y29uc3QgdmFsdWVzID0gdHJlZS5lbGVtZW50cy5tYXAoKHRyZWVOb2RlKSA9PiB7XG5cdFx0XHRpZiAodHJlZU5vZGUgPT09IG51bGwpIHJldHVybiAnJztcblx0XHRcdGlmICh0cmVlTm9kZS50eXBlID09PSAnU3ByZWFkRWxlbWVudCcpIHJldHVybiBub3JtYWxpemVDbGFzc1dhbGtlcih0cmVlTm9kZS5hcmd1bWVudCwgc3RhY2spO1xuXHRcdFx0cmV0dXJuIG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWVOb2RlLCBzdGFjayk7XG5cdFx0fSk7XG5cdFx0aWYgKHZhbHVlcy5zb21lKCh4KSA9PiB4ID09PSBudWxsKSkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIHZhbHVlcy5qb2luKCcgJyk7XG5cdH1cblx0aWYgKHRyZWUudHlwZSA9PT0gJ09iamVjdEV4cHJlc3Npb24nKSB7XG5cdFx0Y29uc3QgdmFsdWVzID0gdHJlZS5wcm9wZXJ0aWVzLm1hcCgodHJlZU5vZGUpID0+IHtcblx0XHRcdGlmICh0cmVlTm9kZS50eXBlID09PSAnU3ByZWFkRWxlbWVudCcpIHJldHVybiBub3JtYWxpemVDbGFzc1dhbGtlcih0cmVlTm9kZS5hcmd1bWVudCwgc3RhY2spO1xuXHRcdFx0bGV0IHggPSB0cmVlTm9kZS52YWx1ZTtcblx0XHRcdGxldCBpbnZldGVkID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAoeC50eXBlID09PSAnVW5hcnlFeHByZXNzaW9uJyAmJiB4Lm9wZXJhdG9yID09PSAnIScpIHtcblx0XHRcdFx0eCA9IHguYXJndW1lbnQ7XG5cdFx0XHRcdGludmV0ZWQgPSAhaW52ZXRlZDtcblx0XHRcdH1cblx0XHRcdGlmICh4LnR5cGUgPT09ICdMaXRlcmFsJykge1xuXHRcdFx0XHRpZiAoaW52ZXRlZCA9PT0gIXgudmFsdWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJlZU5vZGUua2V5LnR5cGUgPT09ICdJZGVudGlmaWVyJyA/IHRyZWVOb2RlLmNvbXB1dGVkID8gbnVsbCA6IHRyZWVOb2RlLmtleS5uYW1lIDogdHJlZU5vZGUua2V5LnR5cGUgPT09ICdMaXRlcmFsJyA/IHRyZWVOb2RlLmtleS52YWx1ZSA6ICcnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKHgudHlwZSA9PT0gJ0lkZW50aWZpZXInKSB7XG5cdFx0XHRcdGlmIChpbnZldGVkICE9PSBpc0ZhbHN5SWRlbnRpZmllcih4KSkge1xuXHRcdFx0XHRcdHJldHVybiAnJztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSk7XG5cdFx0aWYgKHZhbHVlcy5zb21lKCh4KSA9PiB4ID09PSBudWxsKSkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIHZhbHVlcy5qb2luKCcgJyk7XG5cdH1cblx0aWYgKFxuXHRcdHRyZWUudHlwZSAhPT0gJ0NhbGxFeHByZXNzaW9uJyAmJlxuXHRcdHRyZWUudHlwZSAhPT0gJ0NoYWluRXhwcmVzc2lvbicgJiZcblx0XHR0cmVlLnR5cGUgIT09ICdDb25kaXRpb25hbEV4cHJlc3Npb24nICYmXG5cdFx0dHJlZS50eXBlICE9PSAnTG9naWNhbEV4cHJlc3Npb24nICYmXG5cdFx0dHJlZS50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcblx0XHRjb25zb2xlLmVycm9yKHN0YWNrID8gYFVuZXhwZWN0ZWQgbm9kZSB0eXBlOiAke3RyZWUudHlwZX0gKGluICR7c3RhY2t9KWAgOiBgVW5leHBlY3RlZCBub2RlIHR5cGU6ICR7dHJlZS50eXBlfWApO1xuXHR9XG5cdHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xhc3ModHJlZTogZXN0cmVlLk5vZGUsIHN0YWNrPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG5cdGNvbnN0IHdhbGtlZCA9IG5vcm1hbGl6ZUNsYXNzV2Fsa2VyKHRyZWUsIHN0YWNrKTtcblx0cmV0dXJuIHdhbGtlZCAmJiB3YWxrZWQucmVwbGFjZSgvXlxccyt8XFxzKyg/PVxccyl8XFxzKyQvZywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53aW5kQ3NzTW9kdWxlQ2xhc3NOYW1lKGFzdDogZXN0cmVlLk5vZGUpOiB2b2lkIHtcblx0KHdhbGsgYXMgdHlwZW9mIGVzdHJlZVdhbGtlci53YWxrKShhc3QsIHtcblx0XHRlbnRlcihub2RlLCBwYXJlbnQpOiB2b2lkIHtcblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0aWYgKHBhcmVudD8udHlwZSAhPT0gJ1Byb2dyYW0nKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGNvbnN0IG5hbWUgPSBub2RlLmRlY2xhcmF0aW9uc1swXS5pZC5uYW1lO1xuXHRcdFx0aWYgKG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQ/LnR5cGUgIT09ICdDYWxsRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS5uYW1lICE9PSAnX2V4cG9ydF9zZmMnKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHMubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMF0udHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRjb25zdCBpZGVudCA9IG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzBdLm5hbWU7XG5cdFx0XHRpZiAoIWlkZW50LnN0YXJ0c1dpdGgoJ19zZmNfbWFpbicpKSByZXR1cm47XG5cdFx0XHRpZiAobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0udHlwZSAhPT0gJ0FycmF5RXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1sxXS5lbGVtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcblx0XHRcdGNvbnN0IF9fY3NzTW9kdWxlc0luZGV4ID0gbm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHMuZmluZEluZGV4KCh4KSA9PiB7XG5cdFx0XHRcdGlmICh4Py50eXBlICE9PSAnQXJyYXlFeHByZXNzaW9uJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5lbGVtZW50cy5sZW5ndGggIT09IDIpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZWxlbWVudHNbMF0/LnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5lbGVtZW50c1swXS52YWx1ZSAhPT0gJ19fY3NzTW9kdWxlcycpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZWxlbWVudHNbMV0/LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdFx0aWYgKCF+X19jc3NNb2R1bGVzSW5kZXgpIHJldHVybjtcblx0XHRcdC8qIFRoaXMgcmVnaW9uIGFzc3VtZWVkIHRoYXQgdGhlIGVudGVyZWQgbm9kZSBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgU29tZUNvbXBvbmVudCA9IF9leHBvcnRfc2ZjKF9zZmNfbWFpbiwgW1tcImZvb1wiLCBiYXJdLCBbXCJfX2Nzc01vZHVsZXNcIiwgY3NzTW9kdWxlc11dKTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0Y29uc3QgY3NzTW9kdWxlRm9yZXN0TmFtZSA9ICgobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHNbX19jc3NNb2R1bGVzSW5kZXhdIGFzIGVzdHJlZS5BcnJheUV4cHJlc3Npb24pLmVsZW1lbnRzWzFdIGFzIGVzdHJlZS5JZGVudGlmaWVyKS5uYW1lO1xuXHRcdFx0Y29uc3QgY3NzTW9kdWxlRm9yZXN0Tm9kZSA9IHBhcmVudC5ib2R5LmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zWzBdLmlkLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gY3NzTW9kdWxlRm9yZXN0TmFtZSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaW5pdD8udHlwZSAhPT0gJ09iamVjdEV4cHJlc3Npb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuVmFyaWFibGVEZWNsYXJhdGlvbjtcblx0XHRcdGNvbnN0IG1vZHVsZUZvcmVzdCA9IG5ldyBNYXAoKGNzc01vZHVsZUZvcmVzdE5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQgYXMgZXN0cmVlLk9iamVjdEV4cHJlc3Npb24pLnByb3BlcnRpZXMuZmxhdE1hcCgocHJvcGVydHkpID0+IHtcblx0XHRcdFx0aWYgKHByb3BlcnR5LnR5cGUgIT09ICdQcm9wZXJ0eScpIHJldHVybiBbXTtcblx0XHRcdFx0aWYgKHByb3BlcnR5LmtleS50eXBlICE9PSAnTGl0ZXJhbCcpIHJldHVybiBbXTtcblx0XHRcdFx0aWYgKHByb3BlcnR5LnZhbHVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIFtdO1xuXHRcdFx0XHRyZXR1cm4gW1twcm9wZXJ0eS5rZXkudmFsdWUgYXMgc3RyaW5nLCBwcm9wZXJ0eS52YWx1ZS5uYW1lIGFzIHN0cmluZ11dO1xuXHRcdFx0fSkpO1xuXHRcdFx0LyogVGhpcyByZWdpb24gY29sbGVjdGVkIGEgVmFyaWFibGVEZWNsYXJhdGlvbiBub2RlIGluIHRoZSBtb2R1bGUgdGhhdCBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgY3NzTW9kdWxlcyA9IHtcblx0XHRcdCAqICAgXCIkc3R5bGVcIjogc3R5bGUwLFxuXHRcdFx0ICogfTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0Y29uc3Qgc2ZjTWFpbiA9IHBhcmVudC5ib2R5LmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zWzBdLmlkLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gaWRlbnQpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9KSBhcyB1bmtub3duIGFzIGVzdHJlZS5WYXJpYWJsZURlY2xhcmF0aW9uO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQ/LnR5cGUgIT09ICdDYWxsRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGlmIChzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmNhbGxlZS5uYW1lICE9PSAnZGVmaW5lQ29tcG9uZW50JykgcmV0dXJuO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkgcmV0dXJuO1xuXHRcdFx0aWYgKHNmY01haW4uZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzBdLnR5cGUgIT09ICdPYmplY3RFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0Y29uc3Qgc2V0dXAgPSBzZmNNYWluLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzLmZpbmQoKHgpID0+IHtcblx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1Byb3BlcnR5JykgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRpZiAoeC5rZXkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICh4LmtleS5uYW1lICE9PSAnc2V0dXAnKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuUHJvcGVydHk7XG5cdFx0XHRpZiAoc2V0dXAudmFsdWUudHlwZSAhPT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdGNvbnN0IHJlbmRlciA9IHNldHVwLnZhbHVlLmJvZHkuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdGlmICh4LnR5cGUgIT09ICdSZXR1cm5TdGF0ZW1lbnQnKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuUmV0dXJuU3RhdGVtZW50O1xuXHRcdFx0aWYgKHJlbmRlci5hcmd1bWVudD8udHlwZSAhPT0gJ0Fycm93RnVuY3Rpb25FeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0aWYgKHJlbmRlci5hcmd1bWVudC5wYXJhbXMubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cdFx0XHRjb25zdCBjdHggPSByZW5kZXIuYXJndW1lbnQucGFyYW1zWzBdO1xuXHRcdFx0aWYgKGN0eC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdGlmIChjdHgubmFtZSAhPT0gJ19jdHgnKSByZXR1cm47XG5cdFx0XHRpZiAocmVuZGVyLmFyZ3VtZW50LmJvZHkudHlwZSAhPT0gJ0Jsb2NrU3RhdGVtZW50JykgcmV0dXJuO1xuXHRcdFx0LyogVGhpcyByZWdpb24gYXNzdW1lZCB0aGF0IGBzZmNNYWluYCBsb29rcyBsaWtlIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgX3NmY19tYWluID0gZGVmaW5lQ29tcG9uZW50KHtcblx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHQgKiAgICAgLi4uXG5cdFx0XHQgKiAgICAgcmV0dXJuIChfY3R4LCBfY2FjaGUpID0+IHtcblx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0ICogICAgIH07XG5cdFx0XHQgKiAgIH0sXG5cdFx0XHQgKiB9KTtcblx0XHRcdCAqIGBgYFxuXHRcdFx0ICovXG5cdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG1vZHVsZUZvcmVzdCkge1xuXHRcdFx0XHQvLyNyZWdpb25cblx0XHRcdFx0Y29uc3QgY3NzTW9kdWxlVHJlZU5vZGUgPSBwYXJlbnQuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdFx0aWYgKHgudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0aWYgKHguZGVjbGFyYXRpb25zLmxlbmd0aCAhPT0gMSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRpZiAoeC5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSAhPT0gdmFsdWUpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSkgYXMgdW5rbm93biBhcyBlc3RyZWUuVmFyaWFibGVEZWNsYXJhdGlvbjtcblx0XHRcdFx0aWYgKGNzc01vZHVsZVRyZWVOb2RlLmRlY2xhcmF0aW9uc1swXS5pbml0Py50eXBlICE9PSAnT2JqZWN0RXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgbW9kdWxlVHJlZSA9IG5ldyBNYXAoY3NzTW9kdWxlVHJlZU5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQucHJvcGVydGllcy5mbGF0TWFwKChwcm9wZXJ0eSkgPT4ge1xuXHRcdFx0XHRcdGlmIChwcm9wZXJ0eS50eXBlICE9PSAnUHJvcGVydHknKSByZXR1cm4gW107XG5cdFx0XHRcdFx0Y29uc3QgYWN0dWFsS2V5ID0gcHJvcGVydHkua2V5LnR5cGUgPT09ICdJZGVudGlmaWVyJyA/IHByb3BlcnR5LmtleS5uYW1lIDogcHJvcGVydHkua2V5LnR5cGUgPT09ICdMaXRlcmFsJyA/IHByb3BlcnR5LmtleS52YWx1ZSA6IG51bGw7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBhY3R1YWxLZXkgIT09ICdzdHJpbmcnKSByZXR1cm4gW107XG5cdFx0XHRcdFx0aWYgKHByb3BlcnR5LnZhbHVlLnR5cGUgPT09ICdMaXRlcmFsJykgcmV0dXJuIFtbYWN0dWFsS2V5LCBwcm9wZXJ0eS52YWx1ZS52YWx1ZSBhcyBzdHJpbmddXTtcblx0XHRcdFx0XHRpZiAocHJvcGVydHkudmFsdWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm4gW107XG5cdFx0XHRcdFx0Y29uc3QgbGFiZWxsZWRWYWx1ZSA9IHByb3BlcnR5LnZhbHVlLm5hbWU7XG5cdFx0XHRcdFx0Y29uc3QgYWN0dWFsVmFsdWUgPSBwYXJlbnQuYm9keS5maW5kKCh4KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoeC50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdGlmICh4LmRlY2xhcmF0aW9uc1swXS5pZC5uYW1lICE9PSBsYWJlbGxlZFZhbHVlKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9KSBhcyB1bmtub3duIGFzIGVzdHJlZS5WYXJpYWJsZURlY2xhcmF0aW9uO1xuXHRcdFx0XHRcdGlmIChhY3R1YWxWYWx1ZS5kZWNsYXJhdGlvbnNbMF0uaW5pdD8udHlwZSAhPT0gJ0xpdGVyYWwnKSByZXR1cm4gW107XG5cdFx0XHRcdFx0cmV0dXJuIFtbYWN0dWFsS2V5LCBhY3R1YWxWYWx1ZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC52YWx1ZSBhcyBzdHJpbmddXTtcblx0XHRcdFx0fSkpO1xuXHRcdFx0XHQvKiBUaGlzIHJlZ2lvbiBjb2xsZWN0ZWQgVmFyaWFibGVEZWNsYXJhdGlvbiBub2RlcyBpbiB0aGUgbW9kdWxlIHRoYXQgbG9va3MgbGlrZSB0aGUgZm9sbG93aW5nIGNvZGUuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IGZvbyA9IFwiYmFyXCI7XG5cdFx0XHRcdCAqIGNvbnN0IGJheiA9IFwicXV4XCI7XG5cdFx0XHRcdCAqIGNvbnN0IHN0eWxlMCA9IHtcblx0XHRcdFx0ICogICBmb286IGZvbyxcblx0XHRcdFx0ICogICBiYXo6IGJheixcblx0XHRcdFx0ICogfTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdFx0Ly8jcmVnaW9uXG5cdFx0XHRcdCh3YWxrIGFzIHR5cGVvZiBlc3RyZWVXYWxrZXIud2FsaykocmVuZGVyLmFyZ3VtZW50LmJvZHksIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ01lbWJlckV4cHJlc3Npb24nKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0Lm9iamVjdC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0Lm9iamVjdC5uYW1lICE9PSBjdHgubmFtZSkgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QucHJvcGVydHkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5wcm9wZXJ0eS5uYW1lICE9PSBrZXkpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUucHJvcGVydHkudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRjb25zdCBhY3R1YWxWYWx1ZSA9IG1vZHVsZVRyZWUuZ2V0KGNoaWxkTm9kZS5wcm9wZXJ0eS5uYW1lKTtcblx0XHRcdFx0XHRcdGlmIChhY3R1YWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnTGl0ZXJhbCcsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBhY3R1YWxWYWx1ZSxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHQvKiBUaGlzIHJlZ2lvbiBpbmxpbmVkIHRoZSByZWZlcmVuY2UgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgbmFtZSBpbiB0aGUgcmVuZGVyIGZ1bmN0aW9uIGludG8gdGhlIGFjdHVhbCBsaXRlcmFsLCBhcyBpbiB0aGUgZm9sbG93aW5nIGNvZGUuXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHRcdCAqICAgICAuLi5cblx0XHRcdFx0ICogICAgIHJldHVybiAoX2N0eCwgX2NhY2hlKSA9PiB7XG5cdFx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgICByZXR1cm4gb3BlbkJsb2NrKCksIGNyZWF0ZUVsZW1lbnRCbG9jayhcImRpdlwiLCB7XG5cdFx0XHRcdCAqICAgICAgICAgY2xhc3M6IG5vcm1hbGl6ZUNsYXNzKF9jdHguJHN0eWxlLmZvbyksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIFx1MjE5M1xuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBub3JtYWxpemVDbGFzcyhcImJhclwiKSxcblx0XHRcdFx0ICogICAgICAgfSwgbnVsbCk7XG5cdFx0XHRcdCAqICAgICB9O1xuXHRcdFx0XHQgKiAgIH0sXG5cdFx0XHRcdCAqIH0pO1xuXHRcdFx0XHQgKi9cblx0XHRcdFx0Ly8jZW5kcmVnaW9uXG5cdFx0XHRcdC8vI3JlZ2lvblxuXHRcdFx0XHQod2FsayBhcyB0eXBlb2YgZXN0cmVlV2Fsa2VyLndhbGspKHJlbmRlci5hcmd1bWVudC5ib2R5LCB7XG5cdFx0XHRcdFx0ZW50ZXIoY2hpbGROb2RlKSB7XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLnR5cGUgIT09ICdNZW1iZXJFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QudHlwZSAhPT0gJ01lbWJlckV4cHJlc3Npb24nKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5vYmplY3QudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm9iamVjdC5vYmplY3QubmFtZSAhPT0gY3R4Lm5hbWUpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUub2JqZWN0LnByb3BlcnR5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5vYmplY3QucHJvcGVydHkubmFtZSAhPT0ga2V5KSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLnByb3BlcnR5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgVW5kZWZpbmVkIHN0eWxlIGRldGVjdGVkOiAke2tleX0uJHtjaGlsZE5vZGUucHJvcGVydHkubmFtZX0gKGluICR7bmFtZX0pYCk7XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6ICd1bmRlZmluZWQnLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdC8qIFRoaXMgcmVnaW9uIHJlcGxhY2VkIHRoZSByZWZlcmVuY2UgaWRlbnRpZmllciBvZiBtaXNzaW5nIGNsYXNzIG5hbWVzIGluIHRoZSByZW5kZXIgZnVuY3Rpb24gd2l0aCBgdW5kZWZpbmVkYCwgYXMgaW4gdGhlIGZvbGxvd2luZyBjb2RlLlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBub3JtYWxpemVDbGFzcyhfY3R4LiRzdHlsZS5ob2dlKSxcblx0XHRcdFx0ICogICAgICAgfSwgbnVsbCk7XG5cdFx0XHRcdCAqICAgICB9O1xuXHRcdFx0XHQgKiAgIH0sXG5cdFx0XHRcdCAqIH0pO1xuXHRcdFx0XHQgKiBgYGBcblx0XHRcdFx0ICpcblx0XHRcdFx0ICogXHUyMTkzXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIGBgYHRzXG5cdFx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHRcdCAqICAgc2V0dXAoX3Byb3BzKSB7XG5cdFx0XHRcdCAqICAgICAuLi5cblx0XHRcdFx0ICogICAgIHJldHVybiAoX2N0eCwgX2NhY2hlKSA9PiB7XG5cdFx0XHRcdCAqICAgICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgICByZXR1cm4gb3BlbkJsb2NrKCksIGNyZWF0ZUVsZW1lbnRCbG9jayhcImRpdlwiLCB7XG5cdFx0XHRcdCAqICAgICAgICAgY2xhc3M6IG5vcm1hbGl6ZUNsYXNzKHVuZGVmaW5lZCksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqL1xuXHRcdFx0XHQvLyNlbmRyZWdpb25cblx0XHRcdFx0Ly8jcmVnaW9uXG5cdFx0XHRcdCh3YWxrIGFzIHR5cGVvZiBlc3RyZWVXYWxrZXIud2FsaykocmVuZGVyLmFyZ3VtZW50LmJvZHksIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ0NhbGxFeHByZXNzaW9uJykgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkTm9kZS5jYWxsZWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLmNhbGxlZS5uYW1lICE9PSAnbm9ybWFsaXplQ2xhc3MnKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHJldHVybjtcblx0XHRcdFx0XHRcdGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDbGFzcyhjaGlsZE5vZGUuYXJndW1lbnRzWzBdLCBuYW1lKTtcblx0XHRcdFx0XHRcdGlmIChub3JtYWxpemVkID09PSBudWxsKSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnTGl0ZXJhbCcsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBub3JtYWxpemVkLFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdC8qIFRoaXMgcmVnaW9uIGNvbXBpbGVkIHRoZSBgbm9ybWFsaXplQ2xhc3NgIGNhbGwgaW50byBhIHBzZXVkby1BT1QgY29tcGlsYXRpb24sIGFzIGluIHRoZSBmb2xsb3dpbmcgY29kZS5cblx0XHRcdFx0ICpcblx0XHRcdFx0ICogYGBgdHNcblx0XHRcdFx0ICogY29uc3QgX3NmY19tYWluID0gZGVmaW5lQ29tcG9uZW50KHtcblx0XHRcdFx0ICogICBzZXR1cChfcHJvcHMpIHtcblx0XHRcdFx0ICogICAgIC4uLlxuXHRcdFx0XHQgKiAgICAgcmV0dXJuIChfY3R4LCBfY2FjaGUpID0+IHtcblx0XHRcdFx0ICogICAgICAgLi4uXG5cdFx0XHRcdCAqICAgICAgIHJldHVybiBvcGVuQmxvY2soKSwgY3JlYXRlRWxlbWVudEJsb2NrKFwiZGl2XCIsIHtcblx0XHRcdFx0ICogICAgICAgICBjbGFzczogbm9ybWFsaXplQ2xhc3MoXCJiYXJcIiksXG5cdFx0XHRcdCAqICAgICAgIH0sIG51bGwpO1xuXHRcdFx0XHQgKiAgICAgfTtcblx0XHRcdFx0ICogICB9LFxuXHRcdFx0XHQgKiB9KTtcblx0XHRcdFx0ICogYGBgXG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIFx1MjE5M1xuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiBgYGB0c1xuXHRcdFx0XHQgKiBjb25zdCBfc2ZjX21haW4gPSBkZWZpbmVDb21wb25lbnQoe1xuXHRcdFx0XHQgKiAgIHNldHVwKF9wcm9wcykge1xuXHRcdFx0XHQgKiAgICAgLi4uXG5cdFx0XHRcdCAqICAgICByZXR1cm4gKF9jdHgsIF9jYWNoZSkgPT4ge1xuXHRcdFx0XHQgKiAgICAgICAuLi5cblx0XHRcdFx0ICogICAgICAgcmV0dXJuIG9wZW5CbG9jaygpLCBjcmVhdGVFbGVtZW50QmxvY2soXCJkaXZcIiwge1xuXHRcdFx0XHQgKiAgICAgICAgIGNsYXNzOiBcImJhclwiLFxuXHRcdFx0XHQgKiAgICAgICB9LCBudWxsKTtcblx0XHRcdFx0ICogICAgIH07XG5cdFx0XHRcdCAqICAgfSxcblx0XHRcdFx0ICogfSk7XG5cdFx0XHRcdCAqIGBgYFxuXHRcdFx0XHQgKi9cblx0XHRcdFx0Ly8jZW5kcmVnaW9uXG5cdFx0XHR9XG5cdFx0XHQvLyNyZWdpb25cblx0XHRcdGlmIChub2RlLmRlY2xhcmF0aW9uc1swXS5pbml0LmFyZ3VtZW50c1sxXS5lbGVtZW50cy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0KHdhbGsgYXMgdHlwZW9mIGVzdHJlZVdhbGtlci53YWxrKShhc3QsIHtcblx0XHRcdFx0XHRlbnRlcihjaGlsZE5vZGUpIHtcblx0XHRcdFx0XHRcdGlmIChjaGlsZE5vZGUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGROb2RlLm5hbWUgIT09IGlkZW50KSByZXR1cm47XG5cdFx0XHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmlkLm5hbWUsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUoKTtcblx0XHRcdFx0LyogTk9URTogVGhlIGFib3ZlIGxvZ2ljIGlzIHZhbGlkIGFzIGxvbmcgYXMgdGhlIGZvbGxvd2luZyB0d28gY29uZGl0aW9ucyBhcmUgbWV0LlxuXHRcdFx0XHQgKlxuXHRcdFx0XHQgKiAtIHRoZSB1bmlxdWVuZXNzIG9mIGBpZGVudGAgaXMga2VwdCB0aHJvdWdob3V0IHRoZSBtb2R1bGVcblx0XHRcdFx0ICogLSBgX2V4cG9ydF9zZmNgIGlzIG5vb3Agd2hlbiB0aGUgc2Vjb25kIGFyZ3VtZW50IGlzIGFuIGVtcHR5IGFycmF5XG5cdFx0XHRcdCAqXG5cdFx0XHRcdCAqIE90aGVyd2lzZSwgdGhlIGJlbG93IGxvZ2ljIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG5cblx0XHRcdFx0dGhpcy5yZXBsYWNlKHtcblx0XHRcdFx0XHR0eXBlOiAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG5cdFx0XHRcdFx0ZGVjbGFyYXRpb25zOiBbe1xuXHRcdFx0XHRcdFx0dHlwZTogJ1ZhcmlhYmxlRGVjbGFyYXRvcicsXG5cdFx0XHRcdFx0XHRpZDoge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmlkLm5hbWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0aW5pdDoge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnSWRlbnRpZmllcicsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IGlkZW50LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9XSxcblx0XHRcdFx0XHRraW5kOiAnY29uc3QnLFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0ICovXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnJlcGxhY2Uoe1xuXHRcdFx0XHRcdHR5cGU6ICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcblx0XHRcdFx0XHRkZWNsYXJhdGlvbnM6IFt7XG5cdFx0XHRcdFx0XHR0eXBlOiAnVmFyaWFibGVEZWNsYXJhdG9yJyxcblx0XHRcdFx0XHRcdGlkOiB7XG5cdFx0XHRcdFx0XHRcdHR5cGU6ICdJZGVudGlmaWVyJyxcblx0XHRcdFx0XHRcdFx0bmFtZTogbm9kZS5kZWNsYXJhdGlvbnNbMF0uaWQubmFtZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRpbml0OiB7XG5cdFx0XHRcdFx0XHRcdHR5cGU6ICdDYWxsRXhwcmVzc2lvbicsXG5cdFx0XHRcdFx0XHRcdGNhbGxlZToge1xuXHRcdFx0XHRcdFx0XHRcdHR5cGU6ICdJZGVudGlmaWVyJyxcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiAnX2V4cG9ydF9zZmMnLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRhcmd1bWVudHM6IFt7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogJ0lkZW50aWZpZXInLFxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGlkZW50LFxuXHRcdFx0XHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogJ0FycmF5RXhwcmVzc2lvbicsXG5cdFx0XHRcdFx0XHRcdFx0ZWxlbWVudHM6IG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQuYXJndW1lbnRzWzFdLmVsZW1lbnRzLnNsaWNlKDAsIF9fY3NzTW9kdWxlc0luZGV4KS5jb25jYXQobm9kZS5kZWNsYXJhdGlvbnNbMF0uaW5pdC5hcmd1bWVudHNbMV0uZWxlbWVudHMuc2xpY2UoX19jc3NNb2R1bGVzSW5kZXggKyAxKSksXG5cdFx0XHRcdFx0XHRcdH1dLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9XSxcblx0XHRcdFx0XHRraW5kOiAnY29uc3QnLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdC8qIFRoaXMgcmVnaW9uIHJlbW92ZWQgdGhlIGBfX2Nzc01vZHVsZXNgIHJlZmVyZW5jZSBmcm9tIHRoZSBzZWNvbmQgYXJndW1lbnQgb2YgYF9leHBvcnRfc2ZjYCwgYXMgaW4gdGhlIGZvbGxvd2luZyBjb2RlLlxuXHRcdFx0ICpcblx0XHRcdCAqIGBgYHRzXG5cdFx0XHQgKiBjb25zdCBTb21lQ29tcG9uZW50ID0gX2V4cG9ydF9zZmMoX3NmY19tYWluLCBbW1wiZm9vXCIsIGJhcl0sIFtcIl9fY3NzTW9kdWxlc1wiLCBjc3NNb2R1bGVzXV0pO1xuXHRcdFx0ICogYGBgXG5cdFx0XHQgKlxuXHRcdFx0ICogXHUyMTkzXG5cdFx0XHQgKlxuXHRcdFx0ICogYGBgdHNcblx0XHRcdCAqIGNvbnN0IFNvbWVDb21wb25lbnQgPSBfZXhwb3J0X3NmYyhfc2ZjX21haW4sIFtbXCJmb29cIiwgYmFyXV0pO1xuXHRcdFx0ICogYGBgXG5cdFx0XHQgKlxuXHRcdFx0ICogV2hlbiB0aGUgZGVjbGFyYXRpb24gYmVjb21lcyBub29wLCBpdCBpcyByZW1vdmVkIGFzIGZvbGxvd3MuXG5cdFx0XHQgKlxuXHRcdFx0ICogYGBgdHNcblx0XHRcdCAqIGNvbnN0IF9zZmNfbWFpbiA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHQgKiAgIC4uLlxuXHRcdFx0ICogfSk7XG5cdFx0XHQgKiBjb25zdCBTb21lQ29tcG9uZW50ID0gX2V4cG9ydF9zZmMoX3NmY19tYWluLCBbXSk7XG5cdFx0XHQgKiBgYGBcblx0XHRcdCAqXG5cdFx0XHQgKiBcdTIxOTNcblx0XHRcdCAqXG5cdFx0XHQgKiBgYGB0c1xuXHRcdFx0ICogY29uc3QgU29tZUNvbXBvbmVudCA9IGRlZmluZUNvbXBvbmVudCh7XG5cdFx0XHQgKiAgIC4uLlxuXHRcdFx0ICogfSk7XG5cdFx0XHQgKi9cblx0XHRcdC8vI2VuZHJlZ2lvblxuXHRcdH0sXG5cdH0pO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwbHVnaW5VbndpbmRDc3NNb2R1bGVDbGFzc05hbWUoKTogUGx1Z2luIHtcblx0cmV0dXJuIHtcblx0XHRuYW1lOiAnVW53aW5kQ3NzTW9kdWxlQ2xhc3NOYW1lJyxcblx0XHRyZW5kZXJDaHVuayhjb2RlKTogeyBjb2RlOiBzdHJpbmcgfSB7XG5cdFx0XHRjb25zdCBhc3QgPSB0aGlzLnBhcnNlKGNvZGUpIGFzIHVua25vd24gYXMgZXN0cmVlLk5vZGU7XG5cdFx0XHR1bndpbmRDc3NNb2R1bGVDbGFzc05hbWUoYXN0KTtcblx0XHRcdHJldHVybiB7IGNvZGU6IGdlbmVyYXRlKGFzdCkgfTtcblx0XHR9LFxuXHR9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmMvd2Fsa2VyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2VzL21pc3NrZXkvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL3dhbGtlci5qc1wiOy8qKlxuICogQHR5cGVkZWYgeyBpbXBvcnQoJ2VzdHJlZScpLk5vZGV9IE5vZGVcbiAqIEB0eXBlZGVmIHt7XG4gKiAgIHNraXA6ICgpID0+IHZvaWQ7XG4gKiAgIHJlbW92ZTogKCkgPT4gdm9pZDtcbiAqICAgcmVwbGFjZTogKG5vZGU6IE5vZGUpID0+IHZvaWQ7XG4gKiB9fSBXYWxrZXJDb250ZXh0XG4gKi9cblxuZXhwb3J0IGNsYXNzIFdhbGtlckJhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5zaG91bGRfc2tpcCA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtOb2RlIHwgbnVsbH0gKi9cblx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdC8qKiBAdHlwZSB7V2Fsa2VyQ29udGV4dH0gKi9cblx0XHR0aGlzLmNvbnRleHQgPSB7XG5cdFx0XHRza2lwOiAoKSA9PiAodGhpcy5zaG91bGRfc2tpcCA9IHRydWUpLFxuXHRcdFx0cmVtb3ZlOiAoKSA9PiAodGhpcy5zaG91bGRfcmVtb3ZlID0gdHJ1ZSksXG5cdFx0XHRyZXBsYWNlOiAobm9kZSkgPT4gKHRoaXMucmVwbGFjZW1lbnQgPSBub2RlKVxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQHRlbXBsYXRlIHtOb2RlfSBQYXJlbnRcblx0ICogQHBhcmFtIHtQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwYXJlbnRcblx0ICogQHBhcmFtIHtrZXlvZiBQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwcm9wXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZH0gaW5kZXhcblx0ICogQHBhcmFtIHtOb2RlfSBub2RlXG5cdCAqL1xuXHRyZXBsYWNlKHBhcmVudCwgcHJvcCwgaW5kZXgsIG5vZGUpIHtcblx0XHRpZiAocGFyZW50ICYmIHByb3ApIHtcblx0XHRcdGlmIChpbmRleCAhPSBudWxsKSB7XG5cdFx0XHRcdC8qKiBAdHlwZSB7QXJyYXk8Tm9kZT59ICovIChwYXJlbnRbcHJvcF0pW2luZGV4XSA9IG5vZGU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvKiogQHR5cGUge05vZGV9ICovIChwYXJlbnRbcHJvcF0pID0gbm9kZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHRlbXBsYXRlIHtOb2RlfSBQYXJlbnRcblx0ICogQHBhcmFtIHtQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwYXJlbnRcblx0ICogQHBhcmFtIHtrZXlvZiBQYXJlbnQgfCBudWxsIHwgdW5kZWZpbmVkfSBwcm9wXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZH0gaW5kZXhcblx0ICovXG5cdHJlbW92ZShwYXJlbnQsIHByb3AsIGluZGV4KSB7XG5cdFx0aWYgKHBhcmVudCAmJiBwcm9wKSB7XG5cdFx0XHRpZiAoaW5kZXggIT09IG51bGwgJiYgaW5kZXggIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQvKiogQHR5cGUge0FycmF5PE5vZGU+fSAqLyAocGFyZW50W3Byb3BdKS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlIHBhcmVudFtwcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjL3N5bmMuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3dvcmtzcGFjZXMvbWlzc2tleS9ub2RlX21vZHVsZXMvLnBucG0vZXN0cmVlLXdhbGtlckAzLjAuMy9ub2RlX21vZHVsZXMvZXN0cmVlLXdhbGtlci9zcmMvc3luYy5qc1wiO2ltcG9ydCB7IFdhbGtlckJhc2UgfSBmcm9tICcuL3dhbGtlci5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYgeyBpbXBvcnQoJ2VzdHJlZScpLk5vZGV9IE5vZGVcbiAqIEB0eXBlZGVmIHsgaW1wb3J0KCcuL3dhbGtlci5qcycpLldhbGtlckNvbnRleHR9IFdhbGtlckNvbnRleHRcbiAqIEB0eXBlZGVmIHsoXG4gKiAgICB0aGlzOiBXYWxrZXJDb250ZXh0LFxuICogICAgbm9kZTogTm9kZSxcbiAqICAgIHBhcmVudDogTm9kZSB8IG51bGwsXG4gKiAgICBrZXk6IHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCB8IG51bGwgfCB1bmRlZmluZWQsXG4gKiAgICBpbmRleDogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZFxuICogKSA9PiB2b2lkfSBTeW5jSGFuZGxlclxuICovXG5cbmV4cG9ydCBjbGFzcyBTeW5jV2Fsa2VyIGV4dGVuZHMgV2Fsa2VyQmFzZSB7XG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N5bmNIYW5kbGVyfSBbZW50ZXJdXG5cdCAqIEBwYXJhbSB7U3luY0hhbmRsZXJ9IFtsZWF2ZV1cblx0ICovXG5cdGNvbnN0cnVjdG9yKGVudGVyLCBsZWF2ZSkge1xuXHRcdHN1cGVyKCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5zaG91bGRfc2tpcCA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXG5cdFx0LyoqIEB0eXBlIHtOb2RlIHwgbnVsbH0gKi9cblx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdC8qKiBAdHlwZSB7V2Fsa2VyQ29udGV4dH0gKi9cblx0XHR0aGlzLmNvbnRleHQgPSB7XG5cdFx0XHRza2lwOiAoKSA9PiAodGhpcy5zaG91bGRfc2tpcCA9IHRydWUpLFxuXHRcdFx0cmVtb3ZlOiAoKSA9PiAodGhpcy5zaG91bGRfcmVtb3ZlID0gdHJ1ZSksXG5cdFx0XHRyZXBsYWNlOiAobm9kZSkgPT4gKHRoaXMucmVwbGFjZW1lbnQgPSBub2RlKVxuXHRcdH07XG5cblx0XHQvKiogQHR5cGUge1N5bmNIYW5kbGVyIHwgdW5kZWZpbmVkfSAqL1xuXHRcdHRoaXMuZW50ZXIgPSBlbnRlcjtcblxuXHRcdC8qKiBAdHlwZSB7U3luY0hhbmRsZXIgfCB1bmRlZmluZWR9ICovXG5cdFx0dGhpcy5sZWF2ZSA9IGxlYXZlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEB0ZW1wbGF0ZSB7Tm9kZX0gUGFyZW50XG5cdCAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuXHQgKiBAcGFyYW0ge1BhcmVudCB8IG51bGx9IHBhcmVudFxuXHQgKiBAcGFyYW0ge2tleW9mIFBhcmVudH0gW3Byb3BdXG5cdCAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW2luZGV4XVxuXHQgKiBAcmV0dXJucyB7Tm9kZSB8IG51bGx9XG5cdCAqL1xuXHR2aXNpdChub2RlLCBwYXJlbnQsIHByb3AsIGluZGV4KSB7XG5cdFx0aWYgKG5vZGUpIHtcblx0XHRcdGlmICh0aGlzLmVudGVyKSB7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfc2tpcCA9IHRoaXMuc2hvdWxkX3NraXA7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfcmVtb3ZlID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHRjb25zdCBfcmVwbGFjZW1lbnQgPSB0aGlzLnJlcGxhY2VtZW50O1xuXHRcdFx0XHR0aGlzLnNob3VsZF9za2lwID0gZmFsc2U7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblxuXHRcdFx0XHR0aGlzLmVudGVyLmNhbGwodGhpcy5jb250ZXh0LCBub2RlLCBwYXJlbnQsIHByb3AsIGluZGV4KTtcblxuXHRcdFx0XHRpZiAodGhpcy5yZXBsYWNlbWVudCkge1xuXHRcdFx0XHRcdG5vZGUgPSB0aGlzLnJlcGxhY2VtZW50O1xuXHRcdFx0XHRcdHRoaXMucmVwbGFjZShwYXJlbnQsIHByb3AsIGluZGV4LCBub2RlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLnNob3VsZF9yZW1vdmUpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZShwYXJlbnQsIHByb3AsIGluZGV4KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHNraXBwZWQgPSB0aGlzLnNob3VsZF9za2lwO1xuXHRcdFx0XHRjb25zdCByZW1vdmVkID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdHRoaXMuc2hvdWxkX3NraXAgPSBfc2hvdWxkX3NraXA7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IF9zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gX3JlcGxhY2VtZW50O1xuXG5cdFx0XHRcdGlmIChza2lwcGVkKSByZXR1cm4gbm9kZTtcblx0XHRcdFx0aWYgKHJlbW92ZWQpIHJldHVybiBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogQHR5cGUge2tleW9mIE5vZGV9ICovXG5cdFx0XHRsZXQga2V5O1xuXG5cdFx0XHRmb3IgKGtleSBpbiBub2RlKSB7XG5cdFx0XHRcdC8qKiBAdHlwZSB7dW5rbm93bn0gKi9cblx0XHRcdFx0Y29uc3QgdmFsdWUgPSBub2RlW2tleV07XG5cblx0XHRcdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG5vZGVzID0gLyoqIEB0eXBlIHtBcnJheTx1bmtub3duPn0gKi8gKHZhbHVlKTtcblx0XHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgaXRlbSA9IG5vZGVzW2ldO1xuXHRcdFx0XHRcdFx0XHRpZiAoaXNOb2RlKGl0ZW0pKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCF0aGlzLnZpc2l0KGl0ZW0sIG5vZGUsIGtleSwgaSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIHJlbW92ZWRcblx0XHRcdFx0XHRcdFx0XHRcdGktLTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGlzTm9kZSh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdHRoaXMudmlzaXQodmFsdWUsIG5vZGUsIGtleSwgbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmxlYXZlKSB7XG5cdFx0XHRcdGNvbnN0IF9yZXBsYWNlbWVudCA9IHRoaXMucmVwbGFjZW1lbnQ7XG5cdFx0XHRcdGNvbnN0IF9zaG91bGRfcmVtb3ZlID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXHRcdFx0XHR0aGlzLnJlcGxhY2VtZW50ID0gbnVsbDtcblx0XHRcdFx0dGhpcy5zaG91bGRfcmVtb3ZlID0gZmFsc2U7XG5cblx0XHRcdFx0dGhpcy5sZWF2ZS5jYWxsKHRoaXMuY29udGV4dCwgbm9kZSwgcGFyZW50LCBwcm9wLCBpbmRleCk7XG5cblx0XHRcdFx0aWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcblx0XHRcdFx0XHRub2RlID0gdGhpcy5yZXBsYWNlbWVudDtcblx0XHRcdFx0XHR0aGlzLnJlcGxhY2UocGFyZW50LCBwcm9wLCBpbmRleCwgbm9kZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGhpcy5zaG91bGRfcmVtb3ZlKSB7XG5cdFx0XHRcdFx0dGhpcy5yZW1vdmUocGFyZW50LCBwcm9wLCBpbmRleCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCByZW1vdmVkID0gdGhpcy5zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdHRoaXMucmVwbGFjZW1lbnQgPSBfcmVwbGFjZW1lbnQ7XG5cdFx0XHRcdHRoaXMuc2hvdWxkX3JlbW92ZSA9IF9zaG91bGRfcmVtb3ZlO1xuXG5cdFx0XHRcdGlmIChyZW1vdmVkKSByZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbm9kZTtcblx0fVxufVxuXG4vKipcbiAqIER1Y2t0eXBlIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgTm9kZX1cbiAqL1xuZnVuY3Rpb24gaXNOb2RlKHZhbHVlKSB7XG5cdHJldHVybiAoXG5cdFx0dmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAndHlwZScgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnR5cGUgPT09ICdzdHJpbmcnXG5cdCk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvbm9kZV9tb2R1bGVzLy5wbnBtL2VzdHJlZS13YWxrZXJAMy4wLjMvbm9kZV9tb2R1bGVzL2VzdHJlZS13YWxrZXIvc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9pbmRleC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9taXNza2V5L25vZGVfbW9kdWxlcy8ucG5wbS9lc3RyZWUtd2Fsa2VyQDMuMC4zL25vZGVfbW9kdWxlcy9lc3RyZWUtd2Fsa2VyL3NyYy9pbmRleC5qc1wiO2ltcG9ydCB7IFN5bmNXYWxrZXIgfSBmcm9tICcuL3N5bmMuanMnO1xuaW1wb3J0IHsgQXN5bmNXYWxrZXIgfSBmcm9tICcuL2FzeW5jLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCdlc3RyZWUnKS5Ob2RlfSBOb2RlXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3N5bmMuanMnKS5TeW5jSGFuZGxlcn0gU3luY0hhbmRsZXJcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vYXN5bmMuanMnKS5Bc3luY0hhbmRsZXJ9IEFzeW5jSGFuZGxlclxuICovXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBhc3RcbiAqIEBwYXJhbSB7e1xuICogICBlbnRlcj86IFN5bmNIYW5kbGVyXG4gKiAgIGxlYXZlPzogU3luY0hhbmRsZXJcbiAqIH19IHdhbGtlclxuICogQHJldHVybnMge05vZGUgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2Fsayhhc3QsIHsgZW50ZXIsIGxlYXZlIH0pIHtcblx0Y29uc3QgaW5zdGFuY2UgPSBuZXcgU3luY1dhbGtlcihlbnRlciwgbGVhdmUpO1xuXHRyZXR1cm4gaW5zdGFuY2UudmlzaXQoYXN0LCBudWxsKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IGFzdFxuICogQHBhcmFtIHt7XG4gKiAgIGVudGVyPzogQXN5bmNIYW5kbGVyXG4gKiAgIGxlYXZlPzogQXN5bmNIYW5kbGVyXG4gKiB9fSB3YWxrZXJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE5vZGUgfCBudWxsPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzeW5jV2Fsayhhc3QsIHsgZW50ZXIsIGxlYXZlIH0pIHtcblx0Y29uc3QgaW5zdGFuY2UgPSBuZXcgQXN5bmNXYWxrZXIoZW50ZXIsIGxlYXZlKTtcblx0cmV0dXJuIGF3YWl0IGluc3RhbmNlLnZpc2l0KGFzdCwgbnVsbCk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmQvdml0ZS5qc29uNS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuanNvbjUudHNcIjsvLyBPcmlnaW5hbDogaHR0cHM6Ly9naXRodWIuY29tL3JvbGx1cC9wbHVnaW5zL3RyZWUvODgzNWRkMmFlZDkyZjQwOGQ3ZGM3MmQ3Y2MyNWE5NzI4ZTE2ZmFjZS9wYWNrYWdlcy9qc29uXG5cbmltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICdyb2xsdXAnO1xuaW1wb3J0IHsgY3JlYXRlRmlsdGVyLCBkYXRhVG9Fc20gfSBmcm9tICdAcm9sbHVwL3BsdWdpbnV0aWxzJztcbmltcG9ydCB7IFJvbGx1cEpzb25PcHRpb25zIH0gZnJvbSAnQHJvbGx1cC9wbHVnaW4tanNvbic7XG5cbi8vIGpzb241IGV4dGVuZHMgU3ludGF4RXJyb3Igd2l0aCBhZGRpdGlvbmFsIGZpZWxkcyAod2l0aG91dCBzdWJjbGFzc2luZylcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qc29uNS9qc29uNS9ibG9iL2RlMzQ0ZjA2MTliZGExNDY1YTZlMjVjNzZmMWMwYzNkZGE4MTA4ZDkvbGliL3BhcnNlLmpzI0wxMTExLUwxMTEyXG5pbnRlcmZhY2UgSnNvbjVTeW50YXhFcnJvciBleHRlbmRzIFN5bnRheEVycm9yIHtcblx0bGluZU51bWJlcjogbnVtYmVyO1xuXHRjb2x1bW5OdW1iZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ganNvbjUob3B0aW9uczogUm9sbHVwSnNvbk9wdGlvbnMgPSB7fSk6IFBsdWdpbiB7XG5cdGNvbnN0IGZpbHRlciA9IGNyZWF0ZUZpbHRlcihvcHRpb25zLmluY2x1ZGUsIG9wdGlvbnMuZXhjbHVkZSk7XG5cdGNvbnN0IGluZGVudCA9ICdpbmRlbnQnIGluIG9wdGlvbnMgPyBvcHRpb25zLmluZGVudCA6ICdcXHQnO1xuXG5cdHJldHVybiB7XG5cdFx0bmFtZTogJ2pzb241JyxcblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcblx0XHR0cmFuc2Zvcm0oanNvbiwgaWQpIHtcblx0XHRcdGlmIChpZC5zbGljZSgtNikgIT09ICcuanNvbjUnIHx8ICFmaWx0ZXIoaWQpKSByZXR1cm4gbnVsbDtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgcGFyc2VkID0gSlNPTjUucGFyc2UoanNvbik7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0Y29kZTogZGF0YVRvRXNtKHBhcnNlZCwge1xuXHRcdFx0XHRcdFx0cHJlZmVyQ29uc3Q6IG9wdGlvbnMucHJlZmVyQ29uc3QsXG5cdFx0XHRcdFx0XHRjb21wYWN0OiBvcHRpb25zLmNvbXBhY3QsXG5cdFx0XHRcdFx0XHRuYW1lZEV4cG9ydHM6IG9wdGlvbnMubmFtZWRFeHBvcnRzLFxuXHRcdFx0XHRcdFx0aW5kZW50LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG1hcDogeyBtYXBwaW5nczogJycgfSxcblx0XHRcdFx0fTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRpZiAoIShlcnIgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikpIHtcblx0XHRcdFx0XHR0aHJvdyBlcnI7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgbWVzc2FnZSA9ICdDb3VsZCBub3QgcGFyc2UgSlNPTjUgZmlsZSc7XG5cdFx0XHRcdGNvbnN0IHsgbGluZU51bWJlciwgY29sdW1uTnVtYmVyIH0gPSBlcnIgYXMgSnNvbjVTeW50YXhFcnJvcjtcblx0XHRcdFx0dGhpcy53YXJuKHsgbWVzc2FnZSwgaWQsIGxvYzogeyBsaW5lOiBsaW5lTnVtYmVyLCBjb2x1bW46IGNvbHVtbk51bWJlciB9IH0pO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxVCxPQUFPLFNBQVM7QUFDclUsU0FBUyxnQkFBZ0I7QUFFekIsU0FBUyxnQkFBQUEscUJBQW9CO0FBRTdCLFlBQVlDLFdBQVU7OztBQ0R0QixZQUFZLFFBQVE7QUFDcEIsWUFBWSxVQUFVO0FBTGtJLElBQU0sMkNBQTJDO0FBT3pNLElBQU0sUUFBUSxJQUFJLFNBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxPQUFPO0FBQUEsRUFDakQsR0FBRztBQUFBLEVBQ0gsR0FBRztBQUFBLEVBQ0gsR0FBRyxPQUFPLFFBQVEsQ0FBQyxFQUNqQixPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxPQUFPLEVBQUUsQ0FBQyxNQUFNLFFBQVEsRUFDN0MsT0FBTyxDQUFDQyxJQUFHLENBQUMsR0FBRyxDQUFDLE9BQU9BLEdBQUUsQ0FBQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHQSxLQUFJLENBQUMsQ0FBQztBQUN2RCxJQUFJLENBQUMsQ0FBQztBQUVOLElBQU0sWUFBWTtBQUFBLEVBQ2pCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVB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RUFDUjtBQUNBLFNBQU87QUFDUjtBQUVBLElBQU0sWUFBd0I7QUFBQTtBQUFBLEVBRTdCLEdBQUc7QUFBQSxFQUNILE1BQU07QUFBQSxFQUNOLFdBQVc7QUFBQSxFQUNYLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNOLFFBQVE7QUFBQSxRQUNQLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNUO0FBQUEsTUFDQSxXQUFXO0FBQUEsTUFDWCxrQkFBa0I7QUFBQSxNQUNsQixrQkFBa0I7QUFBQSxNQUNsQixVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsTUFDWixpQkFBaUI7QUFBQSxNQUNqQixVQUFVO0FBQUEsTUFDVixjQUFjO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTDtBQUFBLE1BQ0EsZ0JBQWdCO0FBQUEsTUFDaEIsZUFBZTtBQUFBLE1BQ2YsYUFBYTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLE1BQ0w7QUFBQSxNQUNBLGNBQWM7QUFBQSxRQUNiLFFBQVE7QUFBQSxRQUNSLFFBQVFDLE9BQU07QUFDYixpQkFBT0EsTUFBSyxRQUFRLG1CQUFtQixFQUFFO0FBQUEsUUFDMUM7QUFBQSxNQUNEO0FBQUEsTUFDQSxRQUFRO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixnQkFBZ0I7QUFBQSxNQUNoQixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsTUFDVDtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLE1BQ1Q7QUFBQSxNQUNBLGdCQUFnQjtBQUFBLFFBQ2YsUUFBUTtBQUFBLE1BQ1Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ04sR0FBRyxjQUFjO0FBQUEsSUFDakIsZUFBZTtBQUFBLE1BQ2QsR0FBRyxjQUFjLE9BQU87QUFBQSxNQUN4QixPQUFPO0FBQUEsSUFDUjtBQUFBLEVBQ0Q7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNQLEdBQUcsY0FBYztBQUFBLElBQ2pCLGNBQWMsS0FBSyxVQUFVLE9BQU8sUUFBUSxlQUFPLENBQUM7QUFBQSxFQUNyRDtBQUNEO0FBRUEsSUFBTyxnQ0FBUUMsY0FBYSxDQUFDLEVBQUUsU0FBUyxLQUFLLE1BQU0sU0FBUzsiLAogICJuYW1lcyI6IFsiZGVmaW5lQ29uZmlnIiwgInlhbWwiLCAiYSIsICJwYWNrYWdlX2RlZmF1bHQiLCAicGFja2FnZV9kZWZhdWx0IiwgInBhdGgiLCAiZGVmaW5lQ29uZmlnIl0KfQo=
