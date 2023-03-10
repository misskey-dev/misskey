const execa = require("execa");
const fs = require("fs");
const yaml = require("js-yaml");
const path =
	process.env.NODE_ENV === "test"
		? path.resolve(__dirname, "../.config/test.yml")
		: path.resolve(__dirname, "../.config/default.yml");
const config = yaml.load(fs.readFileSync(path, "utf-8"));

const start = async () => {
	try {
		const stat = fs.statSync(
			__dirname + "/../packages/backend/built/boot/index.js"
		);
		if (!stat) throw new Error("not exist yet");
		if (stat.size === 0) throw new Error("not built yet");

		await execa(
			"pnpm",
			["start-server-and-test", "start", config.url, "dev:watch"],
			{
				cwd: __dirname + "/../",
				stdout: process.stdout,
				stderr: process.stderr,
			}
		);
	} catch (e) {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		start();
	}
};

start();
