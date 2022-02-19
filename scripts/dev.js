const execa = require('execa');

(async () => {
	await execa('npm', ['run', 'clean'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('npx', ['gulp', 'watch'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('npm', ['run', 'watch'], {
		cwd: __dirname + '/../packages/backend',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('npm', ['run', 'watch'], {
		cwd: __dirname + '/../packages/client',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	execa('npm', ['run', 'watch'], {
		cwd: __dirname + '/../packages/sw',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	const start = async () => {
		try {
			await execa('npm', ['run', 'start'], {
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
