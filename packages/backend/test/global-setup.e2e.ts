/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execaNode } from 'execa';

export default async function globalSetup() {
	// E2Eテスト用のサーバを起動する
	await execaNode('./built-test/entry.js', [], {
		stdout: process.stdout,
		stderr: process.stderr,
		env: {
			NODE_ENV: 'test',
		},
	});
}
