const execa = require('execa');

(async () => {
	console.log('installing dependencies of packages/backend ...');

	await execa('yarn', ['install'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	if (process.env.SKIP_CLIENT !== "YES") {
		console.log('installing dependencies of packages/client ...');

		await execa('yarn', ['install'], {
			cwd: __dirname + '/../packages/client',
			stdout: process.stdout,
			stderr: process.stderr,
		});
	}
})();
