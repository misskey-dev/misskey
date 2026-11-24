/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as stream from 'node:stream/promises';

/**
 * Calculate MD5 hash
 */
export async function calcHash(path: string): Promise<string> {
	const hash = crypto.createHash('md5').setEncoding('hex');
	await stream.pipeline(fs.createReadStream(path), hash);
	return hash.read();
}
