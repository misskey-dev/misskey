const execa = require("execa");
const fs = require("fs");

const start = async () => {
	try {
		const exist = fs.existsSync(
			__dirname + "/../packages/backend/built/boot/index.js"
		);
		if (!exist) throw new Error("not exist yet");

		await execa("pnpm", ["start"], {
			cwd: __dirname + "/../",
			stdout: process.stdout,
			stderr: process.stderr,
		});
	} catch (e) {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		start();
	}
};

start();
