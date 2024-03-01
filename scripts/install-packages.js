import { execa } from "execa";
const __dirname = new URL('.', import.meta.url).pathname;

(async () => {
	console.log('installing dependencies of packages/backend ...');

	await execa('npm', ['ci'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log('installing dependencies of packages/client ...');

	await execa('npm', ['ci'], {
		cwd: __dirname + '/../packages/frontend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log('installing dependencies of packages/sw ...');

	await execa('npm', ['ci'], {
		cwd: __dirname + '/../packages/sw',
		stdout: process.stdout,
		stderr: process.stderr,
	});
})();
