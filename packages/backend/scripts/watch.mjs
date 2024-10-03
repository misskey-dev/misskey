/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
