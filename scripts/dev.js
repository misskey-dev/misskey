const execa = require('execa');
const fs = require('fs');

(async () => {
	await execa('yarn', ['clean'], {
		cwd: __dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await execa('yarn', ['build-pre'], {
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

	execa('yarn', ['workspace', 'frontend', 'watch'], {
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
			const exist = fs.existsSync(__dirname + '/../packages/backend/built/boot/index.js')
			if (!exist) throw new Error('not exist yet');

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
