/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as process from 'node:process';
import { checkNewRelease, checkNewTopic } from './checker.js';
import { parseChangeLog } from './parser.js';

function abort(message?: string) {
	if (message) {
		console.error(message);
	}

	process.exit(1);
}

function main() {
	if (!fs.existsSync('./CHANGELOG-base.md') || !fs.existsSync('./CHANGELOG-head.md')) {
		console.error('CHANGELOG-base.md or CHANGELOG-head.md is missing.');
		return;
	}

	const base = parseChangeLog('./CHANGELOG-base.md');
	const head = parseChangeLog('./CHANGELOG-head.md');

	const result = (base.length < head.length)
		? checkNewRelease(base, head)
		: checkNewTopic(base, head);

	if (!result.success) {
		abort(result.message);
		return;
	}
}

main();
