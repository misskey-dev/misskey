/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Writable, WritableOptions } from 'node:stream';

export class DevNull extends Writable implements NodeJS.WritableStream {
	constructor(opts?: WritableOptions) {
		super(opts);
	}

	_write (chunk: any, encoding: BufferEncoding, cb: (err?: Error | null) => void) {
		setImmediate(cb);
	}
}
