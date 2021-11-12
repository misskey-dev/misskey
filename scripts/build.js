const execa = require('execa');

(async () => {
	console.log('building packages/backend ...');

	await execa('npm', ['run', 'build'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log('building packages/client ...');

	await execa('npm', ['run', 'build'], {
		cwd: __dirname + '/../packages/client',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await execa('npm', ['run', 'build'], {
		cwd: __dirname + '/../packages/client',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log('build finishing ...');

	await execa('npm', ['run', 'gulp'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});
})();
