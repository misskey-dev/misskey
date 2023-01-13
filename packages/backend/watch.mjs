import { execa } from 'execa';

(async () => {
	// なぜかchokidarが動かない影響で、watchされない
	/*
	execa('tsc-alias', ['-w', '-p', 'tsconfig.json'], {
		stdout: process.stdout,
		stderr: process.stderr,
	});
	*/

	setInterval(() => {
		execa('tsc-alias', ['-p', 'tsconfig.json'], {
			stdout: process.stdout,
			stderr: process.stderr,
		});
	}, 3000);

	execa('tsc', ['-w', '-p', 'tsconfig.json'], {
		stdout: process.stdout,
		stderr: process.stderr,
	});
})();
