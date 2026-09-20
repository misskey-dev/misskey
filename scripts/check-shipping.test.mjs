/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { createPnpmCommand } from './check-shipping.mjs';

test('runs the pnpm package CLI through Node instead of a platform shim', () => {
	const command = createPnpmCommand(
		'/repo/node_modules/pnpm/package.json',
		{ bin: { pnpm: 'bin/pnpm.mjs' } },
		'/runtime/node',
	);

	assert.deepEqual(command, {
		command: '/runtime/node',
		args: [resolve('/repo/node_modules/pnpm/bin/pnpm.mjs')],
	});
	assert.equal(command.command.endsWith('.cmd'), false);
});

test('supports a package with a string bin entry', () => {
	const command = createPnpmCommand(
		'/repo/node_modules/pnpm/package.json',
		{ bin: 'bin/pnpm.mjs' },
		'/runtime/node',
	);

	assert.deepEqual(command.args, [resolve('/repo/node_modules/pnpm/bin/pnpm.mjs')]);
});

test('rejects a pnpm package without a usable CLI entry', () => {
	assert.throws(
		() => createPnpmCommand('/repo/node_modules/pnpm/package.json', { bin: {} }, '/runtime/node'),
		/pnpm package.*bin entry/,
	);
});
