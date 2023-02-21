const chokidar = require("chokidar");
const execa = require("execa");
const path = require("node:path");
const locales = require("../locales");
const meta = require("../package.json");
const v = { _version_: meta.version };
const fs = require("fs");
const watch = process.argv[2]?.includes("watch");

// build:init
fs.mkdirSync(__dirname + "/built", {
	recursive: true,
});
fs.mkdirSync(__dirname + "/../packages/backend/built/server/web/views", {
	recursive: true,
});

// build:backend:script
chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/*.js", {
		persistent: watch ? true : false,
		ignoreInitial: watch ? true : false,
		ignored: __dirname + "/../packages/backend/src/server/web/boot.js",
	})
	.on("add", (paths) => {
		execa(
			"pnpm",
			[
				"terser",
				paths,
				"-o",
				__dirname +
					"/../packages/backend/built/server/web/" +
					path.win32.basename(paths),
				"--toplevel",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	})
	.on("change", (paths) => {
		execa(
			"pnpm",
			[
				"terser",
				paths,
				"-o",
				__dirname +
					"/../packages/backend/built/server/web/" +
					path.win32.basename(paths),
				"--toplevel",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	});
chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/boot.js", {
		persistent: watch ? true : false,
		ignoreInitial: watch ? true : false,
	})
	.on("add", (paths) => {
		const content = fs.readFileSync(
			__dirname + "/../packages/backend/src/server/web/boot.js",
			{ encoding: "utf8" }
		);
		fs.writeFileSync(
			__dirname + "/built/boot.js",
			content.replace("LANGS", JSON.stringify(Object.keys(locales)))
		);
		execa(
			"pnpm",
			[
				"terser",
				__dirname + "/built/boot.js",
				"-o",
				__dirname + "/../packages/backend/built/server/web/boot.js",
				"--toplevel",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	})
	.on("change", (paths) => {
		const content = fs.readFileSync(
			__dirname + "/../packages/backend/src/server/web/boot.js",
			{ encoding: "utf8" }
		);
		fs.writeFileSync(
			__dirname + "/built/boot.js",
			content.replace("LANGS", JSON.stringify(Object.keys(locales)))
		);
		execa(
			"pnpm",
			[
				"terser",
				__dirname + "/built/boot.js",
				"-o",
				__dirname + "/../packages/backend/built/server/web/boot.js",
				"--toplevel",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	});

// backend:style
chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/*.css", {
		persistent: watch ? true : false,
		ignoreInitial: watch ? true : false,
	})
	.on("add", (paths) => {
		execa(
			"pnpm",
			[
				"postcss",
				paths,
				"-o",
				__dirname +
					"/../packages/backend/built/server/web/" +
					path.win32.basename(paths),
				"--config",
				__dirname + "/postcss.config.js",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	})
	.on("change", (paths) => {
		execa(
			"pnpm",
			[
				"postcss",
				paths,
				"-o",
				__dirname +
					"/../packages/backend/built/server/web/" +
					path.win32.basename(paths),
				"--config",
				__dirname + "/postcss.config.js",
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	});

// backend:views
chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/views/*", {
		persistent: watch ? true : false,
		ignoreInitial: watch ? true : false,
	})
	.on("add", (paths) => {
		execa(
			"pnpm",
			[
				"shx",
				"cp",
				"-rf",
				paths,
				__dirname +
					"/../packages/backend/built/server/web/views/" +
					path.win32.basename(paths),
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	})
	.on("change", (paths) => {
		execa(
			"pnpm",
			[
				"shx",
				"cp",
				"-rf",
				paths,
				__dirname +
					"/../packages/backend/built/server/web/views/" +
					path.win32.basename(paths),
			],
			{
				cwd: __dirname + "/",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	});

if (watch ? false : true) {
	// frontend:fonts
	fs.mkdirSync(__dirname + "/../built/_frontend_dist_/fonts", {
		recursive: true,
	});
	execa(
		"pnpm",
		[
			"shx",
			"cp",
			"-rf",
			__dirname + "/../packages/frontend/node_modules/three/examples/fonts/",
			__dirname + "/../built/_frontend_dist_",
		],
		{
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		}
	);

	// frontend:locales
	fs.mkdirSync(__dirname + "/../built/_frontend_dist_/locales", {
		recursive: true,
	});
	for (const [lang, locale] of Object.entries(locales)) {
		fs.writeFileSync(
			__dirname +
				`/../built/_frontend_dist_/locales/${lang}.${meta.version}.json`,
			JSON.stringify({ ...locale, ...v }),
			"utf-8"
		);
	}

	// frontend:tabler-icons
	fs.mkdirSync(__dirname + "/../built/_frontend_dist_/tabler-icons", {
		recursive: true,
	});
	execa(
		"pnpm",
		[
			"shx",
			"cp",
			"-rf",
			__dirname + "/../packages/frontend/node_modules/@tabler/icons-webfont/*",
			__dirname + "/../built/_frontend_dist_/tabler-icons",
		],
		{
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		}
	);
}
