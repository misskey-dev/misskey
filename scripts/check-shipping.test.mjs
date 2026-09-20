/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './check-shipping.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

for (const status of [0, 1, 2]) {
	test(`preserves subprocess exit code ${status}`, () => {
		assert.equal(runCommand(process.execPath, ['-e', `process.exit(${status})`], repoRoot), status);
	});
}

test('reports a subprocess that cannot start as an operational error', () => {
	assert.throws(
		() => runCommand(process.execPath, [], join(repoRoot, 'missing-shipping-directory')),
		/を実行できない:.*ENOENT/s,
	);
});

test('runs local pnpm from a package directory without changing filename arguments', () => {
	const cwd = join(repoRoot, 'packages', 'frontend');
	const filenames = ['src/file with spaces.ts', 'src/notes & replies.ts'];
	const script = [
		"const assert = require('node:assert/strict');",
		`assert.equal(process.cwd(), ${JSON.stringify(cwd)});`,
		`assert.deepEqual(process.argv.slice(1), ${JSON.stringify(filenames)});`,
	].join(' ');

	assert.equal(runCommand('pnpm', ['exec', 'node', '-e', script, '--', ...filenames], cwd), 0);
});

test('runs a Windows pnpm.cmd shim', { skip: process.platform !== 'win32' }, () => {
	assert.equal(runCommand(join(repoRoot, 'node_modules', '.bin', 'pnpm.cmd'), ['--version'], repoRoot), 0);
});
