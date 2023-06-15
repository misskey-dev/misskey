const execa = require("execa");
const fs = require("fs");
const yaml = require("js-yaml");
const path =
	process.env.NODE_ENV === "test"
		? __dirname + "/../.config/test.yml"
		: __dirname + "/../.config/default.yml";
const config = yaml.load(fs.readFileSync(path, "utf-8"));

const start = async () => {
	try {
		const stat = fs.statSync(
			__dirname + "/../packages/backend/built/boot/index.js"
		);
		if (!stat) throw new Error("not exist yet");
		if (stat.size === 0) throw new Error("not built yet");

		const subprocess = await execa(
			"pnpm",
			["start-server-and-test", "start", config.url, "dev:watch"],
			{
				cwd: __dirname + "/../",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);

		// なぜかworkerだけが終了してmasterが残るのでその対策
		process.on("SIGINT", () => {
			subprocess.kill("SIGINT");
			process.exit(0);
		});
	} catch (e) {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		start();
	}
};

start();
