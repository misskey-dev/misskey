#!/usr/bin/env node
import child_process from 'node:child_process';
import path from 'node:path';
import url from 'node:url';

import semver from 'semver';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = [];
args.push(...[
	...semver.satisfies(process.version, '^20.17.0 || ^22.0.0 || ^24.10.0') ? ['--no-experimental-require-module'] : [],
	'--experimental-vm-modules',
	'--experimental-import-meta-resolve',
	path.join(__dirname, 'node_modules/jest/bin/jest.js'),
	...process.argv.slice(2),
]);

const child = child_process.spawn(process.execPath, args, { stdio: 'inherit' });
child.on('error', (err) => {
	console.error('Failed to start Jest:', err);
	process.exit(1);
});
child.on('exit', (code, signal) => {
	if (code === null) {
		process.exit(128 + signal);
	} else {
		process.exit(code);
	}
});
