#!/usr/bin/env node
import child_process from 'node:child_process';
import path from 'node:path';

import semver from 'semver';

const args = [];
args.push(...[
	...semver.satisfies(process.version, '^20.17.0 || ^22.0.0') ? ['--no-experimental-require-module'] : [],
	'--experimental-vm-modules',
	'--experimental-import-meta-resolve',
	path.join(import.meta.dirname, 'node_modules/jest/bin/jest.js'),
])

child_process.spawn(process.execPath, args, { stdio: 'inherit' });
