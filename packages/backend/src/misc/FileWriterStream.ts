/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PathLike } from 'node:fs';
import * as fs from 'node:fs/promises';
import { WritableStream } from 'node:stream/web';

/**
 * `fs.createWriteStream()`相当のことを行う`WritableStream` (Web標準)
 */
export class FileWriterStream extends WritableStream<Uint8Array> {
	constructor(path: PathLike) {
		let file: fs.FileHandle | null = null;

		super({
			start: async () => {
				file = await fs.open(path, 'a');
			},
			write: async (chunk, controller) => {
				if (file === null) {
					controller.error();
					throw new Error();
				}

				await file.write(chunk);
			},
			close: async () => {
				await file?.close();
			},
			abort: async () => {
				await file?.close();
			},
		});
	}
}
