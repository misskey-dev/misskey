const chokidar = require("chokidar");
const execa = require("execa");

//gulp.task watch
chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/**/*.js")
	.on("ready", () => console.log("Initial scan complete. Ready for changes"))
	.on("add", (path) => console.log(`File ${path} has been added`))
	.on("change", (path) => {
		console.log(`File ${path} has been changed`);

		execa("pnpm", ["build:post:backend:script"], {
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	})
	.on("unlink", (path) => console.log(`File ${path} has been removed`));

chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/*.css")
	.on("all", (event, path) => {
		execa("pnpm", ["build:post:backend:style"], {
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	});

chokidar
	.watch(__dirname + "/../packages/backend/src/server/web/views/**/*")
	.on("all", (event, path) => {
		execa("pnpm", ["build:post:backend:views"], {
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	});

chokidar
	.watch(__dirname + "/../packages/frontend/node_modules/three/examples/fonts/**/*")
	.on("all", (event, path) => {
		execa("pnpm", ["build:post:frontend:fonts"], {
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	});

chokidar
	.watch(__dirname + "/../packages/frontend/node_modules/@tabler/icons-webfont/**/*")
	.on("all", (event, path) => {
		execa("pnpm", ["build:post:frontend:tabler-icons"], {
			cwd: __dirname + "/",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	});
