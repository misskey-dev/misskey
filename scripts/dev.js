const execa = require('execa');

(async () => {
	await execa('yarn', ['clean'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('yarn', ['dlx', 'gulp', 'watch'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('yarn', ['workspace', 'backend', 'watch'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('yarn', ['workspace', 'client', 'watch'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('yarn', ['workspace', 'sw', 'watch'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	const start = async () => {
		try {
			await execa('yarn', ['start'], {
				cwd: __dirname + '/../',
				stdout: process.stdout,
				stderr: process.stderr,
			});
		} catch (e) {
			await new Promise(resolve => setTimeout(resolve, 3000));
			start();
		}
	};

	start();
})();
