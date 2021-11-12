const execa = require('execa');

(async () => {
	await execa('npm', ['run', 'lint'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});
})();
