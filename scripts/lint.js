const execa = require('execa');

(async () => {
	console.log('linting packages/backend ...');
	await execa('npm', ['run', 'lint'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log('linting packages/client ...');
	await execa('npm', ['run', 'lint'], {
		cwd: __dirname + '/../packages/client',
		stdout: process.stdout,
		stderr: process.stderr,
	});
})();
