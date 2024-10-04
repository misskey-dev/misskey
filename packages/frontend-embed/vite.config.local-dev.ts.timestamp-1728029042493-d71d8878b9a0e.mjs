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
  name: "frontend-embed",
  private: true,
  type: "module",
  scripts: {
    watch: "vite",
    dev: "vite --config vite.config.local-dev.ts --debug hmr",
    build: "vite build",
    typecheck: "vue-tsc --noEmit",
    eslint: 'eslint --quiet "src/**/*.{ts,vue}"',
    lint: "pnpm typecheck && pnpm eslint"
  },
  dependencies: {
    "@discordapp/twemoji": "15.1.0",
    "@rollup/plugin-json": "6.1.0",
    "@rollup/plugin-replace": "5.0.7",
    "@rollup/pluginutils": "5.1.2",
    "@tabler/icons-webfont": "3.3.0",
    "@twemoji/parser": "15.1.1",
    "@vitejs/plugin-vue": "5.1.4",
    "@vue/compiler-sfc": "3.5.10",
    astring: "1.9.0",
    buraha: "0.0.1",
    "estree-walker": "3.0.3",
    "mfm-js": "0.24.0",
    "misskey-js": "workspace:*",
    "frontend-shared": "workspace:*",
    punycode: "2.3.1",
    rollup: "4.22.5",
    sass: "1.79.3",
    shiki: "1.12.0",
    tinycolor2: "1.6.0",
    "tsc-alias": "1.8.10",
    "tsconfig-paths": "4.2.0",
    typescript: "5.6.2",
    uuid: "10.0.0",
    json5: "2.2.3",
    vite: "5.4.8",
    vue: "3.5.10"
  },
  devDependencies: {
    "@misskey-dev/summaly": "5.1.0",
    "@testing-library/vue": "8.1.0",
    "@types/estree": "1.0.6",
    "@types/micromatch": "4.0.9",
    "@types/node": "20.14.12",
    "@types/punycode": "2.1.4",
    "@types/tinycolor2": "1.4.6",
    "@types/uuid": "10.0.0",
    "@types/ws": "8.5.12",
    "@typescript-eslint/eslint-plugin": "7.17.0",
    "@typescript-eslint/parser": "7.17.0",
    "@vitest/coverage-v8": "1.6.0",
    "@vue/runtime-core": "3.5.10",
    acorn: "8.12.1",
    "cross-env": "7.0.3",
    "eslint-plugin-import": "2.30.0",
    "eslint-plugin-vue": "9.28.0",
    "fast-glob": "3.3.2",
    "happy-dom": "10.0.3",
    "intersection-observer": "0.12.2",
    micromatch: "4.0.8",
    msw: "2.3.4",
    nodemon: "3.1.7",
    prettier: "3.3.3",
    "start-server-and-test": "2.0.8",
    "vite-plugin-turbosnap": "1.0.3",
    "vue-component-type-helpers": "2.1.6",
    "vue-eslint-parser": "9.4.3",
    "vue-tsc": "2.1.6"
  }
};

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
var __vite_injected_original_dirname = "/workspaces/misskey/packages/frontend-embed";
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
    base: "/embed_vite/",
    server: {
      port: 5174
    },
    plugins: [
      pluginVue(),
      json5()
    ],
    resolve: {
      extensions,
      alias: {
        "@/": __vite_injected_original_dirname + "/src/",
        "@@/": __vite_injected_original_dirname + "/../frontend-shared/",
        "/client-assets/": __vite_injected_original_dirname + "/assets/",
        "/static-assets/": __vite_injected_original_dirname + "/../backend/assets/"
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
      __VUE_OPTIONS_API__: false,
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
          app: "./src/boot.ts"
        },
        external: externalPackages.map((p) => p.match),
        output: {
          manualChunks: {
            vue: ["vue"]
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
      outDir: __vite_injected_original_dirname + "/../../built/_frontend_embed_vite_",
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
  base: "/embed",
  server: {
    host: "localhost",
    port: 5174,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubG9jYWwtZGV2LnRzIiwgIi4uLy4uL2xvY2FsZXMvaW5kZXguanMiLCAidml0ZS5jb25maWcudHMiLCAiLi4vLi4vcGFja2FnZS5qc29uIiwgInBhY2thZ2UuanNvbiIsICJ2aXRlLmpzb241LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC1lbWJlZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC1lbWJlZC92aXRlLmNvbmZpZy5sb2NhbC1kZXYudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC1lbWJlZC92aXRlLmNvbmZpZy5sb2NhbC1kZXYudHNcIjtpbXBvcnQgZG5zIGZyb20gJ2Rucyc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UgfSBmcm9tICdub2RlOmh0dHAnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdHlwZSB7IFVzZXJDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCAqIGFzIHlhbWwgZnJvbSAnanMteWFtbCc7XG5pbXBvcnQgbG9jYWxlcyBmcm9tICcuLi8uLi9sb2NhbGVzL2luZGV4LmpzJztcbmltcG9ydCB7IGdldENvbmZpZyB9IGZyb20gJy4vdml0ZS5jb25maWcuanMnO1xuXG5kbnMuc2V0RGVmYXVsdFJlc3VsdE9yZGVyKCdpcHY0Zmlyc3QnKTtcblxuY29uc3QgZGVmYXVsdENvbmZpZyA9IGdldENvbmZpZygpO1xuXG5jb25zdCB7IHBvcnQgfSA9IHlhbWwubG9hZChhd2FpdCByZWFkRmlsZSgnLi4vLi4vLmNvbmZpZy9kZWZhdWx0LnltbCcsICd1dGYtOCcpKTtcblxuY29uc3QgaHR0cFVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vYDtcbmNvbnN0IHdlYnNvY2tldFVybCA9IGB3czovL2xvY2FsaG9zdDoke3BvcnR9L2A7XG5cbi8vIGFjdGl2aXR5cHViXHUzMEVBXHUzMEFGXHUzMEE4XHUzMEI5XHUzMEM4XHUzMDZGUHJveHlcdTMwOTJcdTkwMUFcdTMwNTdcdTMwMDFcdTMwNURcdTMwOENcdTRFRTVcdTU5MTZcdTMwNkZWaXRlXHUzMDZFXHU5NThCXHU3NjdBXHUzMEI1XHUzMEZDXHUzMEQwXHUzMEZDXHUzMDkyXHU4RkQ0XHUzMDU5XG5mdW5jdGlvbiB2YXJ5SGFuZGxlcihyZXE6IEluY29taW5nTWVzc2FnZSkge1xuXHRpZiAocmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygnYXBwbGljYXRpb24vYWN0aXZpdHkranNvbicpKSB7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblx0cmV0dXJuICcvaW5kZXguaHRtbCc7XG59XG5cbmNvbnN0IGRldkNvbmZpZzogVXNlckNvbmZpZyA9IHtcblx0Ly8gXHU1N0ZBXHU2NzJDXHUzMDZFXHU4QTJEXHU1QjlBXHUzMDZGIHZpdGUuY29uZmlnLmpzIFx1MzA0Qlx1MzA4OVx1NUYxNVx1MzA0RFx1N0Q5OVx1MzA1MFxuXHQuLi5kZWZhdWx0Q29uZmlnLFxuXHRyb290OiAnc3JjJyxcblx0cHVibGljRGlyOiAnLi4vYXNzZXRzJyxcblx0YmFzZTogJy9lbWJlZCcsXG5cdHNlcnZlcjoge1xuXHRcdGhvc3Q6ICdsb2NhbGhvc3QnLFxuXHRcdHBvcnQ6IDUxNzQsXG5cdFx0cHJveHk6IHtcblx0XHRcdCcvYXBpJzoge1xuXHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXG5cdFx0XHRcdHRhcmdldDogaHR0cFVybCxcblx0XHRcdH0sXG5cdFx0XHQnL2Fzc2V0cyc6IGh0dHBVcmwsXG5cdFx0XHQnL3N0YXRpYy1hc3NldHMnOiBodHRwVXJsLFxuXHRcdFx0Jy9jbGllbnQtYXNzZXRzJzogaHR0cFVybCxcblx0XHRcdCcvZmlsZXMnOiBodHRwVXJsLFxuXHRcdFx0Jy90d2Vtb2ppJzogaHR0cFVybCxcblx0XHRcdCcvZmx1ZW50LWVtb2ppJzogaHR0cFVybCxcblx0XHRcdCcvc3cuanMnOiBodHRwVXJsLFxuXHRcdFx0Jy9zdHJlYW1pbmcnOiB7XG5cdFx0XHRcdHRhcmdldDogd2Vic29ja2V0VXJsLFxuXHRcdFx0XHR3czogdHJ1ZSxcblx0XHRcdH0sXG5cdFx0XHQnL2Zhdmljb24uaWNvJzogaHR0cFVybCxcblx0XHRcdCcvcm9ib3RzLnR4dCc6IGh0dHBVcmwsXG5cdFx0XHQnL2VtYmVkLmpzJzogaHR0cFVybCxcblx0XHRcdCcvaWRlbnRpY29uJzoge1xuXHRcdFx0XHR0YXJnZXQ6IGh0dHBVcmwsXG5cdFx0XHRcdHJld3JpdGUocGF0aCkge1xuXHRcdFx0XHRcdHJldHVybiBwYXRoLnJlcGxhY2UoJ0Bsb2NhbGhvc3Q6NTE3MycsICcnKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHQnL3VybCc6IGh0dHBVcmwsXG5cdFx0XHQnL3Byb3h5JzogaHR0cFVybCxcblx0XHRcdCcvX2luZm9fY2FyZF8nOiBodHRwVXJsLFxuXHRcdFx0Jy9iaW9zJzogaHR0cFVybCxcblx0XHRcdCcvY2xpJzogaHR0cFVybCxcblx0XHRcdCcvaW5ib3gnOiBodHRwVXJsLFxuXHRcdFx0Jy9lbW9qaS8nOiBodHRwVXJsLFxuXHRcdFx0Jy9ub3Rlcyc6IHtcblx0XHRcdFx0dGFyZ2V0OiBodHRwVXJsLFxuXHRcdFx0XHRieXBhc3M6IHZhcnlIYW5kbGVyLFxuXHRcdFx0fSxcblx0XHRcdCcvdXNlcnMnOiB7XG5cdFx0XHRcdHRhcmdldDogaHR0cFVybCxcblx0XHRcdFx0YnlwYXNzOiB2YXJ5SGFuZGxlcixcblx0XHRcdH0sXG5cdFx0XHQnLy53ZWxsLWtub3duJzoge1xuXHRcdFx0XHR0YXJnZXQ6IGh0dHBVcmwsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0sXG5cdGJ1aWxkOiB7XG5cdFx0Li4uZGVmYXVsdENvbmZpZy5idWlsZCxcblx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHQuLi5kZWZhdWx0Q29uZmlnLmJ1aWxkPy5yb2xsdXBPcHRpb25zLFxuXHRcdFx0aW5wdXQ6ICdpbmRleC5odG1sJyxcblx0XHR9LFxuXHR9LFxuXG5cdGRlZmluZToge1xuXHRcdC4uLmRlZmF1bHRDb25maWcuZGVmaW5lLFxuXHRcdF9MQU5HU19GVUxMXzogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmVudHJpZXMobG9jYWxlcykpLFxuXHR9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQsIG1vZGUgfSkgPT4gZGV2Q29uZmlnKTtcblxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L2xvY2FsZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL21pc3NrZXkvbG9jYWxlcy9pbmRleC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9taXNza2V5L2xvY2FsZXMvaW5kZXguanNcIjsvKipcbiAqIExhbmd1YWdlcyBMb2FkZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHlhbWwgZnJvbSAnanMteWFtbCc7XG5cbmNvbnN0IG1lcmdlID0gKC4uLmFyZ3MpID0+IGFyZ3MucmVkdWNlKChhLCBjKSA9PiAoe1xuXHQuLi5hLFxuXHQuLi5jLFxuXHQuLi5PYmplY3QuZW50cmllcyhhKVxuXHRcdC5maWx0ZXIoKFtrXSkgPT4gYyAmJiB0eXBlb2YgY1trXSA9PT0gJ29iamVjdCcpXG5cdFx0LnJlZHVjZSgoYSwgW2ssIHZdKSA9PiAoYVtrXSA9IG1lcmdlKHYsIGNba10pLCBhKSwge30pXG59KSwge30pO1xuXG5jb25zdCBsYW5ndWFnZXMgPSBbXG5cdCdhci1TQScsXG5cdCdjcy1DWicsXG5cdCdkYS1ESycsXG5cdCdkZS1ERScsXG5cdCdlbi1VUycsXG5cdCdlcy1FUycsXG5cdCdmci1GUicsXG5cdCdpZC1JRCcsXG5cdCdpdC1JVCcsXG5cdCdqYS1KUCcsXG5cdCdqYS1LUycsXG5cdCdrYWItS0FCJyxcblx0J2tuLUlOJyxcblx0J2tvLUtSJyxcblx0J25sLU5MJyxcblx0J25vLU5PJyxcblx0J3BsLVBMJyxcblx0J3B0LVBUJyxcblx0J3J1LVJVJyxcblx0J3NrLVNLJyxcblx0J3RoLVRIJyxcblx0J3VnLUNOJyxcblx0J3VrLVVBJyxcblx0J3ZpLVZOJyxcblx0J3poLUNOJyxcblx0J3poLVRXJyxcbl07XG5cbmNvbnN0IHByaW1hcmllcyA9IHtcblx0J2VuJzogJ1VTJyxcblx0J2phJzogJ0pQJyxcblx0J3poJzogJ0NOJyxcbn07XG5cbi8vIFx1NEY1NVx1NjU0NVx1MzA0Qlx1NjU4N1x1NUI1N1x1NTIxN1x1MzA2Qlx1MzBEMFx1MzBDM1x1MzBBRlx1MzBCOVx1MzBEQVx1MzBGQ1x1MzBCOVx1NjU4N1x1NUI1N1x1MzA0Q1x1NkRGN1x1NTE2NVx1MzA1OVx1MzA4Qlx1MzA1M1x1MzA2OFx1MzA0Q1x1MzA0Mlx1MzA4QVx1MzAwMVlBTUxcdTMwNENcdTU4Q0FcdTMwOENcdTMwOEJcdTMwNkVcdTMwNjdcdTUzRDZcdTMwOEFcdTk2NjRcdTMwNEZcbmNvbnN0IGNsZWFuID0gKHRleHQpID0+IHRleHQucmVwbGFjZShuZXcgUmVnRXhwKFN0cmluZy5mcm9tQ29kZVBvaW50KDB4MDgpLCAnZycpLCAnJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZCgpIHtcblx0Ly8gdml0ZXN0XHUzMDZFXHU2MzE5XHU1MkQ1XHUzMDkyXHU4QUJGXHU2NTc0XHUzMDU5XHUzMDhCXHUzMDVGXHUzMDgxXHUzMDAxXHU0RTAwXHU1RUE2XHUzMEVEXHUzMEZDXHUzMEFCXHUzMEVCXHU1OTA5XHU2NTcwXHU1MzE2XHUzMDU5XHUzMDhCXHU1RkM1XHU4OTgxXHUzMDRDXHUzMDQyXHUzMDhCXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlc3QtZGV2L3ZpdGVzdC9pc3N1ZXMvMzk4OCNpc3N1ZWNvbW1lbnQtMTY4NjU5OTU3N1xuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vbWlzc2tleS1kZXYvbWlzc2tleS9wdWxsLzE0MDU3I2lzc3VlY29tbWVudC0yMTkyODMzNzg1XG5cdGNvbnN0IG1ldGFVcmwgPSBpbXBvcnQubWV0YS51cmw7XG5cdGNvbnN0IGxvY2FsZXMgPSBsYW5ndWFnZXMucmVkdWNlKChhLCBjKSA9PiAoYVtjXSA9IHlhbWwubG9hZChjbGVhbihmcy5yZWFkRmlsZVN5bmMobmV3IFVSTChgJHtjfS55bWxgLCBtZXRhVXJsKSwgJ3V0Zi04JykpKSB8fCB7fSwgYSksIHt9KTtcblxuXHQvLyBcdTdBN0FcdTY1ODdcdTVCNTdcdTUyMTdcdTMwNENcdTUxNjVcdTMwOEJcdTMwNTNcdTMwNjhcdTMwNENcdTMwNDJcdTMwOEFcdTMwMDFcdTMwRDVcdTMwQTlcdTMwRkNcdTMwRUJcdTMwRDBcdTMwQzNcdTMwQUZcdTMwNENcdTUyRDVcdTRGNUNcdTMwNTdcdTMwNkFcdTMwNEZcdTMwNkFcdTMwOEJcdTMwNkVcdTMwNjdcdTMwRDdcdTMwRURcdTMwRDFcdTMwQzZcdTMwQTNcdTMwNTRcdTMwNjhcdTZEODhcdTMwNTlcblx0Y29uc3QgcmVtb3ZlRW1wdHkgPSAob2JqKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMob2JqKSkge1xuXHRcdFx0aWYgKHYgPT09ICcnKSB7XG5cdFx0XHRcdGRlbGV0ZSBvYmpba107XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRyZW1vdmVFbXB0eSh2KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblx0cmVtb3ZlRW1wdHkobG9jYWxlcyk7XG5cblx0cmV0dXJuIE9iamVjdC5lbnRyaWVzKGxvY2FsZXMpXG5cdFx0LnJlZHVjZSgoYSwgW2ssIHZdKSA9PiAoYVtrXSA9ICgoKSA9PiB7XG5cdFx0XHRjb25zdCBbbGFuZ10gPSBrLnNwbGl0KCctJyk7XG5cdFx0XHRzd2l0Y2ggKGspIHtcblx0XHRcdFx0Y2FzZSAnamEtSlAnOiByZXR1cm4gdjtcblx0XHRcdFx0Y2FzZSAnamEtS1MnOlxuXHRcdFx0XHRjYXNlICdlbi1VUyc6IHJldHVybiBtZXJnZShsb2NhbGVzWydqYS1KUCddLCB2KTtcblx0XHRcdFx0ZGVmYXVsdDogcmV0dXJuIG1lcmdlKFxuXHRcdFx0XHRcdGxvY2FsZXNbJ2phLUpQJ10sXG5cdFx0XHRcdFx0bG9jYWxlc1snZW4tVVMnXSxcblx0XHRcdFx0XHRsb2NhbGVzW2Ake2xhbmd9LSR7cHJpbWFyaWVzW2xhbmddfWBdID8/IHt9LFxuXHRcdFx0XHRcdHZcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9KSgpLCBhKSwge30pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBidWlsZCgpO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kLWVtYmVkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlcy9taXNza2V5L3BhY2thZ2VzL2Zyb250ZW5kLWVtYmVkL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmQtZW1iZWQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwbHVnaW5WdWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCB7IHR5cGUgVXNlckNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmltcG9ydCBsb2NhbGVzIGZyb20gJy4uLy4uL2xvY2FsZXMvaW5kZXguanMnO1xuaW1wb3J0IG1ldGEgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBwYWNrYWdlSW5mbyBmcm9tICcuL3BhY2thZ2UuanNvbicgd2l0aCB7IHR5cGU6ICdqc29uJyB9O1xuaW1wb3J0IHBsdWdpbkpzb241IGZyb20gJy4vdml0ZS5qc29uNS5qcyc7XG5cbmNvbnN0IGV4dGVuc2lvbnMgPSBbJy50cycsICcudHN4JywgJy5qcycsICcuanN4JywgJy5tanMnLCAnLmpzb24nLCAnLmpzb241JywgJy5zdmcnLCAnLnNhc3MnLCAnLnNjc3MnLCAnLmNzcycsICcudnVlJ107XG5cbi8qKlxuICogTWlzc2tleVx1MzA2RVx1MzBENVx1MzBFRFx1MzBGM1x1MzBDOFx1MzBBOFx1MzBGM1x1MzBDOVx1MzA2Qlx1MzBEMFx1MzBGM1x1MzBDOVx1MzBFQlx1MzA1Qlx1MzA1QVx1MzAwMUNETlx1MzA2QVx1MzA2OVx1MzA0Qlx1MzA4OVx1NTIyNVx1OTAxNFx1OEFBRFx1MzA3Rlx1OEZCQ1x1MzA4MFx1MzBFQVx1MzBCRFx1MzBGQ1x1MzBCOVx1MzA5Mlx1OEExOFx1OEZGMFx1MzA1OVx1MzA4Qlx1MzAwMlxuICogQ0ROXHUzMDkyXHU0RjdGXHUzMDhGXHUzMDVBXHUzMDZCXHUzMEQwXHUzMEYzXHUzMEM5XHUzMEVCXHUzMDU3XHUzMDVGXHUzMDQ0XHU1ODM0XHU1NDA4XHUzMDAxXHU0RUU1XHU0RTBCXHUzMDZFXHU5MTREXHU1MjE3XHUzMDRCXHUzMDg5XHU4QTcyXHU1RjUzXHU4OTgxXHU3RDIwXHUzMDkyXHU1MjRBXHU5NjY0b3JcdTMwQjNcdTMwRTFcdTMwRjNcdTMwQzhcdTMwQTJcdTMwQTZcdTMwQzhcdTMwNTlcdTMwOENcdTMwNzBPS1xuICovXG5jb25zdCBleHRlcm5hbFBhY2thZ2VzID0gW1xuXHQvLyBzaGlraVx1RkYwOFx1MzBCM1x1MzBGQ1x1MzBDOVx1MzBENlx1MzBFRFx1MzBDM1x1MzBBRlx1MzA2RVx1MzBCN1x1MzBGM1x1MzBCRlx1MzBDM1x1MzBBRlx1MzBCOVx1MzBDRlx1MzBBNFx1MzBFOVx1MzBBNFx1MzBDOFx1MzA2N1x1NEY3Rlx1NzUyOFx1NEUyRFx1RkYwOVx1MzA2Rlx1MzBDNlx1MzBGQ1x1MzBERVx1MzBGQlx1OEEwMFx1OEE5RVx1MzA2RVx1NUI5QVx1N0ZBOVx1MzA2RVx1NUJCOVx1OTFDRlx1MzA0Q1x1NTkyN1x1MzA0RFx1MzA0NFx1MzA1Rlx1MzA4MVx1MzAwMVx1MzA1RFx1MzA4Q1x1MzA4OVx1MzA2RkNETlx1MzA0Qlx1MzA4OVx1OEFBRFx1MzA3Rlx1OEZCQ1x1MzA4MFxuXHR7XG5cdFx0bmFtZTogJ3NoaWtpJyxcblx0XHRtYXRjaDogL15zaGlraVxcLyg/PHN1YlBrZz4obGFuZ3N8dGhlbWVzKSkkLyxcblx0XHRwYXRoKGlkOiBzdHJpbmcsIHBhdHRlcm46IFJlZ0V4cCk6IHN0cmluZyB7XG5cdFx0XHRjb25zdCBtYXRjaCA9IHBhdHRlcm4uZXhlYyhpZCk/Lmdyb3Vwcztcblx0XHRcdHJldHVybiBtYXRjaFxuXHRcdFx0XHQ/IGBodHRwczovL2VzbS5zaC9zaGlraUAke3BhY2thZ2VJbmZvLmRlcGVuZGVuY2llcy5zaGlraX0vJHttYXRjaFsnc3ViUGtnJ119YFxuXHRcdFx0XHQ6IGlkO1xuXHRcdH0sXG5cdH0sXG5dO1xuXG5jb25zdCBoYXNoID0gKHN0cjogc3RyaW5nLCBzZWVkID0gMCk6IG51bWJlciA9PiB7XG5cdGxldCBoMSA9IDB4ZGVhZGJlZWYgXiBzZWVkLFxuXHRcdGgyID0gMHg0MWM2Y2U1NyBeIHNlZWQ7XG5cdGZvciAobGV0IGkgPSAwLCBjaDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuXHRcdGNoID0gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdFx0aDEgPSBNYXRoLmltdWwoaDEgXiBjaCwgMjY1NDQzNTc2MSk7XG5cdFx0aDIgPSBNYXRoLmltdWwoaDIgXiBjaCwgMTU5NzMzNDY3Nyk7XG5cdH1cblxuXHRoMSA9IE1hdGguaW11bChoMSBeIChoMSA+Pj4gMTYpLCAyMjQ2ODIyNTA3KSBeIE1hdGguaW11bChoMiBeIChoMiA+Pj4gMTMpLCAzMjY2NDg5OTA5KTtcblx0aDIgPSBNYXRoLmltdWwoaDIgXiAoaDIgPj4+IDE2KSwgMjI0NjgyMjUwNykgXiBNYXRoLmltdWwoaDEgXiAoaDEgPj4+IDEzKSwgMzI2NjQ4OTkwOSk7XG5cblx0cmV0dXJuIDQyOTQ5NjcyOTYgKiAoMjA5NzE1MSAmIGgyKSArIChoMSA+Pj4gMCk7XG59O1xuXG5jb25zdCBCQVNFNjJfRElHSVRTID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcblxuZnVuY3Rpb24gdG9CYXNlNjIobjogbnVtYmVyKTogc3RyaW5nIHtcblx0aWYgKG4gPT09IDApIHtcblx0XHRyZXR1cm4gJzAnO1xuXHR9XG5cdGxldCByZXN1bHQgPSAnJztcblx0d2hpbGUgKG4gPiAwKSB7XG5cdFx0cmVzdWx0ID0gQkFTRTYyX0RJR0lUU1tuICUgQkFTRTYyX0RJR0lUUy5sZW5ndGhdICsgcmVzdWx0O1xuXHRcdG4gPSBNYXRoLmZsb29yKG4gLyBCQVNFNjJfRElHSVRTLmxlbmd0aCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCk6IFVzZXJDb25maWcge1xuXHRyZXR1cm4ge1xuXHRcdGJhc2U6ICcvZW1iZWRfdml0ZS8nLFxuXG5cdFx0c2VydmVyOiB7XG5cdFx0XHRwb3J0OiA1MTc0LFxuXHRcdH0sXG5cblx0XHRwbHVnaW5zOiBbXG5cdFx0XHRwbHVnaW5WdWUoKSxcblx0XHRcdHBsdWdpbkpzb241KCksXG5cdFx0XSxcblxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGV4dGVuc2lvbnMsXG5cdFx0XHRhbGlhczoge1xuXHRcdFx0XHQnQC8nOiBfX2Rpcm5hbWUgKyAnL3NyYy8nLFxuXHRcdFx0XHQnQEAvJzogX19kaXJuYW1lICsgJy8uLi9mcm9udGVuZC1zaGFyZWQvJyxcblx0XHRcdFx0Jy9jbGllbnQtYXNzZXRzLyc6IF9fZGlybmFtZSArICcvYXNzZXRzLycsXG5cdFx0XHRcdCcvc3RhdGljLWFzc2V0cy8nOiBfX2Rpcm5hbWUgKyAnLy4uL2JhY2tlbmQvYXNzZXRzLydcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdGNzczoge1xuXHRcdFx0bW9kdWxlczoge1xuXHRcdFx0XHRnZW5lcmF0ZVNjb3BlZE5hbWUobmFtZSwgZmlsZW5hbWUsIF9jc3MpOiBzdHJpbmcge1xuXHRcdFx0XHRcdGNvbnN0IGlkID0gKHBhdGgucmVsYXRpdmUoX19kaXJuYW1lLCBmaWxlbmFtZS5zcGxpdCgnPycpWzBdKSArICctJyArIG5hbWUpLnJlcGxhY2UoL1tcXFxcXFwvXFwuXFw/Jj1dL2csICctJykucmVwbGFjZSgvKHNyYy18dnVlLSkvZywgJycpO1xuXHRcdFx0XHRcdGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gJ3gnICsgdG9CYXNlNjIoaGFzaChpZCkpLnN1YnN0cmluZygwLCA0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGlkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0fSxcblxuXHRcdGRlZmluZToge1xuXHRcdFx0X1ZFUlNJT05fOiBKU09OLnN0cmluZ2lmeShtZXRhLnZlcnNpb24pLFxuXHRcdFx0X0xBTkdTXzogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmVudHJpZXMobG9jYWxlcykubWFwKChbaywgdl0pID0+IFtrLCB2Ll9sYW5nX10pKSxcblx0XHRcdF9FTlZfOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViksXG5cdFx0XHRfREVWXzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyxcblx0XHRcdF9QRVJGX1BSRUZJWF86IEpTT04uc3RyaW5naWZ5KCdNaXNza2V5OicpLFxuXHRcdFx0X19WVUVfT1BUSU9OU19BUElfXzogZmFsc2UsXG5cdFx0XHRfX1ZVRV9QUk9EX0RFVlRPT0xTX186IGZhbHNlLFxuXHRcdH0sXG5cblx0XHRidWlsZDoge1xuXHRcdFx0dGFyZ2V0OiBbXG5cdFx0XHRcdCdjaHJvbWUxMTYnLFxuXHRcdFx0XHQnZmlyZWZveDExNicsXG5cdFx0XHRcdCdzYWZhcmkxNicsXG5cdFx0XHRdLFxuXHRcdFx0bWFuaWZlc3Q6ICdtYW5pZmVzdC5qc29uJyxcblx0XHRcdHJvbGx1cE9wdGlvbnM6IHtcblx0XHRcdFx0aW5wdXQ6IHtcblx0XHRcdFx0XHRhcHA6ICcuL3NyYy9ib290LnRzJyxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXh0ZXJuYWw6IGV4dGVybmFsUGFja2FnZXMubWFwKHAgPT4gcC5tYXRjaCksXG5cdFx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHRcdG1hbnVhbENodW5rczoge1xuXHRcdFx0XHRcdFx0dnVlOiBbJ3Z1ZSddLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Y2h1bmtGaWxlTmFtZXM6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyAnW2hhc2g6OF0uanMnIDogJ1tuYW1lXS1baGFzaDo4XS5qcycsXG5cdFx0XHRcdFx0YXNzZXRGaWxlTmFtZXM6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyAnW2hhc2g6OF1bZXh0bmFtZV0nIDogJ1tuYW1lXS1baGFzaDo4XVtleHRuYW1lXScsXG5cdFx0XHRcdFx0cGF0aHMoaWQpIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgcCBvZiBleHRlcm5hbFBhY2thZ2VzKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChwLm1hdGNoLnRlc3QoaWQpKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHAucGF0aChpZCwgcC5tYXRjaCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIGlkO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0Y3NzQ29kZVNwbGl0OiB0cnVlLFxuXHRcdFx0b3V0RGlyOiBfX2Rpcm5hbWUgKyAnLy4uLy4uL2J1aWx0L19mcm9udGVuZF9lbWJlZF92aXRlXycsXG5cdFx0XHRhc3NldHNEaXI6ICcuJyxcblx0XHRcdGVtcHR5T3V0RGlyOiBmYWxzZSxcblx0XHRcdHNvdXJjZW1hcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG5cdFx0XHRyZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG5cblx0XHRcdC8vIGh0dHBzOi8vdml0ZWpzLmRldi9ndWlkZS9kZXAtcHJlLWJ1bmRsaW5nLmh0bWwjbW9ub3JlcG9zLWFuZC1saW5rZWQtZGVwZW5kZW5jaWVzXG5cdFx0XHRjb21tb25qc09wdGlvbnM6IHtcblx0XHRcdFx0aW5jbHVkZTogWy9taXNza2V5LWpzLywgL25vZGVfbW9kdWxlcy9dLFxuXHRcdFx0fSxcblx0XHR9LFxuXG5cdFx0d29ya2VyOiB7XG5cdFx0XHRmb3JtYXQ6ICdlcycsXG5cdFx0fSxcblx0fTtcbn1cblxuY29uc3QgY29uZmlnID0gZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQsIG1vZGUgfSkgPT4gZ2V0Q29uZmlnKCkpO1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iLCAie1xuXHRcIm5hbWVcIjogXCJtaXNza2V5XCIsXG5cdFwidmVyc2lvblwiOiBcIjIwMjQuOS4wLXNoYWh1LjEuNC4wXCIsXG5cdFwiY29kZW5hbWVcIjogXCJuYXN1YmlcIixcblx0XCJyZXBvc2l0b3J5XCI6IHtcblx0XHRcInR5cGVcIjogXCJnaXRcIixcblx0XHRcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS90ZWFtLXNoYWh1L21pc3NrZXlcIlxuXHR9LFxuXHRcInBhY2thZ2VNYW5hZ2VyXCI6IFwicG5wbUA5LjYuMFwiLFxuXHRcIndvcmtzcGFjZXNcIjogW1xuXHRcdFwicGFja2FnZXMvZnJvbnRlbmQtc2hhcmVkXCIsXG5cdFx0XCJwYWNrYWdlcy9mcm9udGVuZFwiLFxuXHRcdFwicGFja2FnZXMvZnJvbnRlbmQtZW1iZWRcIixcblx0XHRcInBhY2thZ2VzL2JhY2tlbmRcIixcblx0XHRcInBhY2thZ2VzL3N3XCIsXG5cdFx0XCJwYWNrYWdlcy9taXNza2V5LWpzXCIsXG5cdFx0XCJwYWNrYWdlcy9taXNza2V5LXJldmVyc2lcIixcblx0XHRcInBhY2thZ2VzL21pc3NrZXktYnViYmxlLWdhbWVcIlxuXHRdLFxuXHRcInByaXZhdGVcIjogdHJ1ZSxcblx0XCJzY3JpcHRzXCI6IHtcblx0XHRcImJ1aWxkLXByZVwiOiBcIm5vZGUgLi9zY3JpcHRzL2J1aWxkLXByZS5qc1wiLFxuXHRcdFwiYnVpbGQtYXNzZXRzXCI6IFwibm9kZSAuL3NjcmlwdHMvYnVpbGQtYXNzZXRzLm1qc1wiLFxuXHRcdFwiYnVpbGRcIjogXCJwbnBtIGJ1aWxkLXByZSAmJiBwbnBtIC1yIGJ1aWxkICYmIHBucG0gYnVpbGQtYXNzZXRzXCIsXG5cdFx0XCJidWlsZC1zdG9yeWJvb2tcIjogXCJwbnBtIC0tZmlsdGVyIGZyb250ZW5kIGJ1aWxkLXN0b3J5Ym9va1wiLFxuXHRcdFwiYnVpbGQtbWlzc2tleS1qcy13aXRoLXR5cGVzXCI6IFwicG5wbSBidWlsZC1wcmUgJiYgcG5wbSAtLWZpbHRlciBiYWNrZW5kLi4uIC0tZmlsdGVyPSFtaXNza2V5LWpzIGJ1aWxkICYmIHBucG0gLS1maWx0ZXIgYmFja2VuZCBnZW5lcmF0ZS1hcGktanNvbiAtLW5vLWJ1aWxkICYmIG5jcCBwYWNrYWdlcy9iYWNrZW5kL2J1aWx0L2FwaS5qc29uIHBhY2thZ2VzL21pc3NrZXktanMvZ2VuZXJhdG9yL2FwaS5qc29uICYmIHBucG0gLS1maWx0ZXIgbWlzc2tleS1qcyB1cGRhdGUtYXV0b2dlbi1jb2RlICYmIHBucG0gLS1maWx0ZXIgbWlzc2tleS1qcyBidWlsZCAmJiBwbnBtIC0tZmlsdGVyIG1pc3NrZXktanMgYXBpXCIsXG5cdFx0XCJzdGFydFwiOiBcInBucG0gY2hlY2s6Y29ubmVjdCAmJiBjZCBwYWNrYWdlcy9iYWNrZW5kICYmIG5vZGUgLi9idWlsdC9ib290L2VudHJ5LmpzXCIsXG5cdFx0XCJzdGFydDp0ZXN0XCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBjcm9zcy1lbnYgTk9ERV9FTlY9dGVzdCBub2RlIC4vYnVpbHQvYm9vdC9lbnRyeS5qc1wiLFxuXHRcdFwiaW5pdFwiOiBcInBucG0gbWlncmF0ZVwiLFxuXHRcdFwibWlncmF0ZVwiOiBcImNkIHBhY2thZ2VzL2JhY2tlbmQgJiYgcG5wbSBtaWdyYXRlXCIsXG5cdFx0XCJyZXZlcnRcIjogXCJjZCBwYWNrYWdlcy9iYWNrZW5kICYmIHBucG0gcmV2ZXJ0XCIsXG5cdFx0XCJjaGVjazpjb25uZWN0XCI6IFwiY2QgcGFja2FnZXMvYmFja2VuZCAmJiBwbnBtIGNoZWNrOmNvbm5lY3RcIixcblx0XHRcIm1pZ3JhdGVhbmRzdGFydFwiOiBcInBucG0gbWlncmF0ZSAmJiBwbnBtIHN0YXJ0XCIsXG5cdFx0XCJ3YXRjaFwiOiBcInBucG0gZGV2XCIsXG5cdFx0XCJkZXZcIjogXCJub2RlIHNjcmlwdHMvZGV2Lm1qc1wiLFxuXHRcdFwibGludFwiOiBcInBucG0gLXIgbGludFwiLFxuXHRcdFwiY3k6b3BlblwiOiBcInBucG0gY3lwcmVzcyBvcGVuIC0tYnJvd3NlciAtLWUyZSAtLWNvbmZpZy1maWxlPWN5cHJlc3MuY29uZmlnLnRzXCIsXG5cdFx0XCJjeTpydW5cIjogXCJwbnBtIGN5cHJlc3MgcnVuXCIsXG5cdFx0XCJlMmVcIjogXCJwbnBtIHN0YXJ0LXNlcnZlci1hbmQtdGVzdCBzdGFydDp0ZXN0IGh0dHA6Ly9sb2NhbGhvc3Q6NjE4MTIgY3k6cnVuXCIsXG5cdFx0XCJlMmUtZGV2LWNvbnRhaW5lclwiOiBcImNwIC4vLmNvbmZpZy9jeXByZXNzLWRldmNvbnRhaW5lci55bWwgLi8uY29uZmlnL3Rlc3QueW1sICYmIHBucG0gc3RhcnQtc2VydmVyLWFuZC10ZXN0IHN0YXJ0OnRlc3QgaHR0cDovL2xvY2FsaG9zdDo2MTgxMiBjeTpydW5cIixcblx0XHRcImplc3RcIjogXCJjZCBwYWNrYWdlcy9iYWNrZW5kICYmIHBucG0gamVzdFwiLFxuXHRcdFwiamVzdC1hbmQtY292ZXJhZ2VcIjogXCJjZCBwYWNrYWdlcy9iYWNrZW5kICYmIHBucG0gamVzdC1hbmQtY292ZXJhZ2VcIixcblx0XHRcInRlc3RcIjogXCJwbnBtIC1yIHRlc3RcIixcblx0XHRcInRlc3QtYW5kLWNvdmVyYWdlXCI6IFwicG5wbSAtciB0ZXN0LWFuZC1jb3ZlcmFnZVwiLFxuXHRcdFwiY2xlYW5cIjogXCJub2RlIC4vc2NyaXB0cy9jbGVhbi5qc1wiLFxuXHRcdFwiY2xlYW4tYWxsXCI6IFwibm9kZSAuL3NjcmlwdHMvY2xlYW4tYWxsLmpzXCIsXG5cdFx0XCJjbGVhbmFsbFwiOiBcInBucG0gY2xlYW4tYWxsXCJcblx0fSxcblx0XCJyZXNvbHV0aW9uc1wiOiB7XG5cdFx0XCJjaG9raWRhclwiOiBcIjMuNS4zXCIsXG5cdFx0XCJsb2Rhc2hcIjogXCI0LjE3LjIxXCJcblx0fSxcblx0XCJkZXBlbmRlbmNpZXNcIjoge1xuXHRcdFwiQGlzYWFjcy90dGxjYWNoZVwiOiBcIl4xLjQuMVwiLFxuXHRcdFwiY3NzbmFub1wiOiBcIjYuMS4yXCIsXG5cdFx0XCJleGVjYVwiOiBcIjguMC4xXCIsXG5cdFx0XCJmYXN0LWdsb2JcIjogXCIzLjMuMlwiLFxuXHRcdFwiaWdub3JlLXdhbGtcIjogXCI2LjAuNVwiLFxuXHRcdFwianMteWFtbFwiOiBcIjQuMS4wXCIsXG5cdFx0XCJwb3N0Y3NzXCI6IFwiOC40LjQ3XCIsXG5cdFx0XCJ0YXJcIjogXCI2LjIuMVwiLFxuXHRcdFwidGVyc2VyXCI6IFwiNS4zMy4wXCIsXG5cdFx0XCJ0eXBlc2NyaXB0XCI6IFwiNS42LjJcIixcblx0XHRcImVzYnVpbGRcIjogXCIwLjIzLjFcIixcblx0XHRcImdsb2JcIjogXCIxMS4wLjBcIlxuXHR9LFxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAbWlzc2tleS1kZXYvZXNsaW50LXBsdWdpblwiOiBcIjIuMC4zXCIsXG5cdFx0XCJAdHlwZXMvbm9kZVwiOiBcIjIwLjE0LjEyXCIsXG5cdFx0XCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiY3Jvc3MtZW52XCI6IFwiNy4wLjNcIixcblx0XHRcImN5cHJlc3NcIjogXCIxMy4xNC4yXCIsXG5cdFx0XCJlc2xpbnRcIjogXCI5LjguMFwiLFxuXHRcdFwiZ2xvYmFsc1wiOiBcIjE1LjkuMFwiLFxuXHRcdFwibmNwXCI6IFwiMi4wLjBcIixcblx0XHRcInN0YXJ0LXNlcnZlci1hbmQtdGVzdFwiOiBcIjIuMC44XCJcblx0fSxcblx0XCJvcHRpb25hbERlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAdGVuc29yZmxvdy90ZmpzLWNvcmVcIjogXCI0LjQuMFwiXG5cdH1cbn1cbiIsICJ7XG5cdFwibmFtZVwiOiBcImZyb250ZW5kLWVtYmVkXCIsXG5cdFwicHJpdmF0ZVwiOiB0cnVlLFxuXHRcInR5cGVcIjogXCJtb2R1bGVcIixcblx0XCJzY3JpcHRzXCI6IHtcblx0XHRcIndhdGNoXCI6IFwidml0ZVwiLFxuXHRcdFwiZGV2XCI6IFwidml0ZSAtLWNvbmZpZyB2aXRlLmNvbmZpZy5sb2NhbC1kZXYudHMgLS1kZWJ1ZyBobXJcIixcblx0XHRcImJ1aWxkXCI6IFwidml0ZSBidWlsZFwiLFxuXHRcdFwidHlwZWNoZWNrXCI6IFwidnVlLXRzYyAtLW5vRW1pdFwiLFxuXHRcdFwiZXNsaW50XCI6IFwiZXNsaW50IC0tcXVpZXQgXFxcInNyYy8qKi8qLnt0cyx2dWV9XFxcIlwiLFxuXHRcdFwibGludFwiOiBcInBucG0gdHlwZWNoZWNrICYmIHBucG0gZXNsaW50XCJcblx0fSxcblx0XCJkZXBlbmRlbmNpZXNcIjoge1xuXHRcdFwiQGRpc2NvcmRhcHAvdHdlbW9qaVwiOiBcIjE1LjEuMFwiLFxuXHRcdFwiQHJvbGx1cC9wbHVnaW4tanNvblwiOiBcIjYuMS4wXCIsXG5cdFx0XCJAcm9sbHVwL3BsdWdpbi1yZXBsYWNlXCI6IFwiNS4wLjdcIixcblx0XHRcIkByb2xsdXAvcGx1Z2ludXRpbHNcIjogXCI1LjEuMlwiLFxuXHRcdFwiQHRhYmxlci9pY29ucy13ZWJmb250XCI6IFwiMy4zLjBcIixcblx0XHRcIkB0d2Vtb2ppL3BhcnNlclwiOiBcIjE1LjEuMVwiLFxuXHRcdFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI6IFwiNS4xLjRcIixcblx0XHRcIkB2dWUvY29tcGlsZXItc2ZjXCI6IFwiMy41LjEwXCIsXG5cdFx0XCJhc3RyaW5nXCI6IFwiMS45LjBcIixcblx0XHRcImJ1cmFoYVwiOiBcIjAuMC4xXCIsXG5cdFx0XCJlc3RyZWUtd2Fsa2VyXCI6IFwiMy4wLjNcIixcblx0XHRcIm1mbS1qc1wiOiBcIjAuMjQuMFwiLFxuXHRcdFwibWlzc2tleS1qc1wiOiBcIndvcmtzcGFjZToqXCIsXG5cdFx0XCJmcm9udGVuZC1zaGFyZWRcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuXHRcdFwicHVueWNvZGVcIjogXCIyLjMuMVwiLFxuXHRcdFwicm9sbHVwXCI6IFwiNC4yMi41XCIsXG5cdFx0XCJzYXNzXCI6IFwiMS43OS4zXCIsXG5cdFx0XCJzaGlraVwiOiBcIjEuMTIuMFwiLFxuXHRcdFwidGlueWNvbG9yMlwiOiBcIjEuNi4wXCIsXG5cdFx0XCJ0c2MtYWxpYXNcIjogXCIxLjguMTBcIixcblx0XHRcInRzY29uZmlnLXBhdGhzXCI6IFwiNC4yLjBcIixcblx0XHRcInR5cGVzY3JpcHRcIjogXCI1LjYuMlwiLFxuXHRcdFwidXVpZFwiOiBcIjEwLjAuMFwiLFxuXHRcdFwianNvbjVcIjogXCIyLjIuM1wiLFxuXHRcdFwidml0ZVwiOiBcIjUuNC44XCIsXG5cdFx0XCJ2dWVcIjogXCIzLjUuMTBcIlxuXHR9LFxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAbWlzc2tleS1kZXYvc3VtbWFseVwiOiBcIjUuMS4wXCIsXG5cdFx0XCJAdGVzdGluZy1saWJyYXJ5L3Z1ZVwiOiBcIjguMS4wXCIsXG5cdFx0XCJAdHlwZXMvZXN0cmVlXCI6IFwiMS4wLjZcIixcblx0XHRcIkB0eXBlcy9taWNyb21hdGNoXCI6IFwiNC4wLjlcIixcblx0XHRcIkB0eXBlcy9ub2RlXCI6IFwiMjAuMTQuMTJcIixcblx0XHRcIkB0eXBlcy9wdW55Y29kZVwiOiBcIjIuMS40XCIsXG5cdFx0XCJAdHlwZXMvdGlueWNvbG9yMlwiOiBcIjEuNC42XCIsXG5cdFx0XCJAdHlwZXMvdXVpZFwiOiBcIjEwLjAuMFwiLFxuXHRcdFwiQHR5cGVzL3dzXCI6IFwiOC41LjEyXCIsXG5cdFx0XCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIjcuMTcuMFwiLFxuXHRcdFwiQHZpdGVzdC9jb3ZlcmFnZS12OFwiOiBcIjEuNi4wXCIsXG5cdFx0XCJAdnVlL3J1bnRpbWUtY29yZVwiOiBcIjMuNS4xMFwiLFxuXHRcdFwiYWNvcm5cIjogXCI4LjEyLjFcIixcblx0XHRcImNyb3NzLWVudlwiOiBcIjcuMC4zXCIsXG5cdFx0XCJlc2xpbnQtcGx1Z2luLWltcG9ydFwiOiBcIjIuMzAuMFwiLFxuXHRcdFwiZXNsaW50LXBsdWdpbi12dWVcIjogXCI5LjI4LjBcIixcblx0XHRcImZhc3QtZ2xvYlwiOiBcIjMuMy4yXCIsXG5cdFx0XCJoYXBweS1kb21cIjogXCIxMC4wLjNcIixcblx0XHRcImludGVyc2VjdGlvbi1vYnNlcnZlclwiOiBcIjAuMTIuMlwiLFxuXHRcdFwibWljcm9tYXRjaFwiOiBcIjQuMC44XCIsXG5cdFx0XCJtc3dcIjogXCIyLjMuNFwiLFxuXHRcdFwibm9kZW1vblwiOiBcIjMuMS43XCIsXG5cdFx0XCJwcmV0dGllclwiOiBcIjMuMy4zXCIsXG5cdFx0XCJzdGFydC1zZXJ2ZXItYW5kLXRlc3RcIjogXCIyLjAuOFwiLFxuXHRcdFwidml0ZS1wbHVnaW4tdHVyYm9zbmFwXCI6IFwiMS4wLjNcIixcblx0XHRcInZ1ZS1jb21wb25lbnQtdHlwZS1oZWxwZXJzXCI6IFwiMi4xLjZcIixcblx0XHRcInZ1ZS1lc2xpbnQtcGFyc2VyXCI6IFwiOS40LjNcIixcblx0XHRcInZ1ZS10c2NcIjogXCIyLjEuNlwiXG5cdH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC1lbWJlZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3dvcmtzcGFjZXMvbWlzc2tleS9wYWNrYWdlcy9mcm9udGVuZC1lbWJlZC92aXRlLmpzb241LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2VzL21pc3NrZXkvcGFja2FnZXMvZnJvbnRlbmQtZW1iZWQvdml0ZS5qc29uNS50c1wiOy8vIE9yaWdpbmFsOiBodHRwczovL2dpdGh1Yi5jb20vcm9sbHVwL3BsdWdpbnMvdHJlZS84ODM1ZGQyYWVkOTJmNDA4ZDdkYzcyZDdjYzI1YTk3MjhlMTZmYWNlL3BhY2thZ2VzL2pzb25cblxuaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJ3JvbGx1cCc7XG5pbXBvcnQgeyBjcmVhdGVGaWx0ZXIsIGRhdGFUb0VzbSB9IGZyb20gJ0Byb2xsdXAvcGx1Z2ludXRpbHMnO1xuaW1wb3J0IHsgUm9sbHVwSnNvbk9wdGlvbnMgfSBmcm9tICdAcm9sbHVwL3BsdWdpbi1qc29uJztcblxuLy8ganNvbjUgZXh0ZW5kcyBTeW50YXhFcnJvciB3aXRoIGFkZGl0aW9uYWwgZmllbGRzICh3aXRob3V0IHN1YmNsYXNzaW5nKVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2pzb241L2pzb241L2Jsb2IvZGUzNDRmMDYxOWJkYTE0NjVhNmUyNWM3NmYxYzBjM2RkYTgxMDhkOS9saWIvcGFyc2UuanMjTDExMTEtTDExMTJcbmludGVyZmFjZSBKc29uNVN5bnRheEVycm9yIGV4dGVuZHMgU3ludGF4RXJyb3Ige1xuXHRsaW5lTnVtYmVyOiBudW1iZXI7XG5cdGNvbHVtbk51bWJlcjogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBqc29uNShvcHRpb25zOiBSb2xsdXBKc29uT3B0aW9ucyA9IHt9KTogUGx1Z2luIHtcblx0Y29uc3QgZmlsdGVyID0gY3JlYXRlRmlsdGVyKG9wdGlvbnMuaW5jbHVkZSwgb3B0aW9ucy5leGNsdWRlKTtcblx0Y29uc3QgaW5kZW50ID0gJ2luZGVudCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuaW5kZW50IDogJ1xcdCc7XG5cblx0cmV0dXJuIHtcblx0XHRuYW1lOiAnanNvbjUnLFxuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuXHRcdHRyYW5zZm9ybShqc29uLCBpZCkge1xuXHRcdFx0aWYgKGlkLnNsaWNlKC02KSAhPT0gJy5qc29uNScgfHwgIWZpbHRlcihpZCkpIHJldHVybiBudWxsO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBwYXJzZWQgPSBKU09ONS5wYXJzZShqc29uKTtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRjb2RlOiBkYXRhVG9Fc20ocGFyc2VkLCB7XG5cdFx0XHRcdFx0XHRwcmVmZXJDb25zdDogb3B0aW9ucy5wcmVmZXJDb25zdCxcblx0XHRcdFx0XHRcdGNvbXBhY3Q6IG9wdGlvbnMuY29tcGFjdCxcblx0XHRcdFx0XHRcdG5hbWVkRXhwb3J0czogb3B0aW9ucy5uYW1lZEV4cG9ydHMsXG5cdFx0XHRcdFx0XHRpbmRlbnQsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bWFwOiB7IG1hcHBpbmdzOiAnJyB9LFxuXHRcdFx0XHR9O1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGlmICghKGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSkge1xuXHRcdFx0XHRcdHRocm93IGVycjtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBtZXNzYWdlID0gJ0NvdWxkIG5vdCBwYXJzZSBKU09ONSBmaWxlJztcblx0XHRcdFx0Y29uc3QgeyBsaW5lTnVtYmVyLCBjb2x1bW5OdW1iZXIgfSA9IGVyciBhcyBKc29uNVN5bnRheEVycm9yO1xuXHRcdFx0XHR0aGlzLndhcm4oeyBtZXNzYWdlLCBpZCwgbG9jOiB7IGxpbmU6IGxpbmVOdW1iZXIsIGNvbHVtbjogY29sdW1uTnVtYmVyIH0gfSk7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXHRcdH0sXG5cdH07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVVLE9BQU8sU0FBUztBQUN2VixTQUFTLGdCQUFnQjtBQUV6QixTQUFTLGdCQUFBQSxxQkFBb0I7QUFFN0IsWUFBWUMsV0FBVTs7O0FDRHRCLFlBQVksUUFBUTtBQUNwQixZQUFZLFVBQVU7QUFMa0ksSUFBTSwyQ0FBMkM7QUFPek0sSUFBTSxRQUFRLElBQUksU0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLE9BQU87QUFBQSxFQUNqRCxHQUFHO0FBQUEsRUFDSCxHQUFHO0FBQUEsRUFDSCxHQUFHLE9BQU8sUUFBUSxDQUFDLEVBQ2pCLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLE9BQU8sRUFBRSxDQUFDLE1BQU0sUUFBUSxFQUM3QyxPQUFPLENBQUNDLElBQUcsQ0FBQyxHQUFHLENBQUMsT0FBT0EsR0FBRSxDQUFDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUdBLEtBQUksQ0FBQyxDQUFDO0FBQ3ZELElBQUksQ0FBQyxDQUFDO0FBRU4sSUFBTSxZQUFZO0FBQUEsRUFDakI7QUFBQSxF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QUczQyxTQUFTLFlBQVksS0FBc0I7QUFDMUMsTUFBSSxJQUFJLFFBQVEsUUFBUSxTQUFTLDJCQUEyQixHQUFHO0FBQzlELFdBQU87QUFBQSxFQUNSO0FBQ0EsU0FBTztBQUNSO0FBRUEsSUFBTSxZQUF3QjtBQUFBO0FBQUEsRUFFN0IsR0FBRztBQUFBLEVBQ0gsTUFBTTtBQUFBLEVBQ04sV0FBVztBQUFBLEVBQ1gsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ1AsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Q7QUFBQSxNQUNBLFdBQVc7QUFBQSxNQUNYLGtCQUFrQjtBQUFBLE1BQ2xCLGtCQUFrQjtBQUFBLE1BQ2xCLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxNQUNaLGlCQUFpQjtBQUFBLE1BQ2pCLFVBQVU7QUFBQSxNQUNWLGNBQWM7QUFBQSxRQUNiLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxNQUNMO0FBQUEsTUFDQSxnQkFBZ0I7QUFBQSxNQUNoQixlQUFlO0FBQUEsTUFDZixhQUFhO0FBQUEsTUFDYixjQUFjO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixRQUFRQyxPQUFNO0FBQ2IsaUJBQU9BLE1BQUssUUFBUSxtQkFBbUIsRUFBRTtBQUFBLFFBQzFDO0FBQUEsTUFDRDtBQUFBLE1BQ0EsUUFBUTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsZ0JBQWdCO0FBQUEsTUFDaEIsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLE1BQ1Q7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNULFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxNQUNUO0FBQUEsTUFDQSxnQkFBZ0I7QUFBQSxRQUNmLFFBQVE7QUFBQSxNQUNUO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNOLEdBQUcsY0FBYztBQUFBLElBQ2pCLGVBQWU7QUFBQSxNQUNkLEdBQUcsY0FBYyxPQUFPO0FBQUEsTUFDeEIsT0FBTztBQUFBLElBQ1I7QUFBQSxFQUNEO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDUCxHQUFHLGNBQWM7QUFBQSxJQUNqQixjQUFjLEtBQUssVUFBVSxPQUFPLFFBQVEsZUFBTyxDQUFDO0FBQUEsRUFDckQ7QUFDRDtBQUVBLElBQU8sZ0NBQVFDLGNBQWEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNLFNBQVM7IiwKICAibmFtZXMiOiBbImRlZmluZUNvbmZpZyIsICJ5YW1sIiwgImEiLCAicGFja2FnZV9kZWZhdWx0IiwgInBhY2thZ2VfZGVmYXVsdCIsICJwYXRoIiwgImRlZmluZUNvbmZpZyJdCn0K
