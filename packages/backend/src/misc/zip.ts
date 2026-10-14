/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fsp } from 'node:fs';
import { Reader, ZipReader } from '@zip.js/zip.js';
import type { FileEntry } from '@zip.js/zip.js';

/**
 * zip.js の Reader を Node.js の FileHandle で実装したもの
 */
class FileHandleReader extends Reader<fsp.FileHandle> {
	constructor(
		private readonly handle: fsp.FileHandle,
		size: number,
	) {
		super(handle);
		this.size = size;
	}

	public override async readUint8Array(index: number, length: number): Promise<Uint8Array> {
		const buffer = new Uint8Array(length);
		let read = 0;
		while (read < length) {
			const { bytesRead } = await this.handle.read(buffer, read, length - read, index + read);
			if (bytesRead === 0) break; // EOF
			read += bytesRead;
		}
		return read === length ? buffer : buffer.subarray(0, read);
	}
}

async function writeAll(handle: fsp.FileHandle, chunk: Uint8Array): Promise<void> {
	let offset = 0;
	while (offset < chunk.byteLength) {
		const { bytesWritten } = await handle.write(chunk, offset, chunk.byteLength - offset);
		offset += bytesWritten;
	}
}

export class ZipExtractError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ZipExtractError';
	}
}

export type ZipExtractOptions = {
	/**
	 * 展開後のサイズ上限 (bytes)
	 */
	maxBytes: number;
};

/**
 * ZIP ファイルを安全に読み取るためのラッパー
 */
export class ZipFile {
	private constructor(
		private readonly handle: fsp.FileHandle,
		private readonly reader: ZipReader<unknown>,
	) {}

	public static async open(path: string): Promise<ZipFile> {
		const handle = await fsp.open(path, 'r');
		try {
			const { size } = await handle.stat();
			const reader = new ZipReader(new FileHandleReader(handle, size), {
				// Node.js には Web Worker が無いのでインラインで処理する
				useWebWorkers: false,
				// 伸長後のデータの CRC-32 を検証する
				checkCrc32: true,
				// `..` を含む名前や絶対パスを持つエントリがあれば拒否する
				filenameValidation: 'balanced',
			});
			return new ZipFile(handle, reader);
		} catch (e) {
			await handle.close();
			throw e;
		}
	}

	/**
	 * ディレクトリ以外のエントリを ZIP 内の順序で 1 件ずつ返します。
	 * 不正な名前や重複した名前のエントリがあれば走査中に例外を投げます。
	 */
	public async *entries(): AsyncGenerator<FileEntry, void, undefined> {
		const seen = new Set<string>();
		for await (const entry of this.reader.getEntriesGenerator()) {
			if (entry.directory) continue;
			if (seen.has(entry.filename)) {
				throw new ZipExtractError(`duplicate entry: ${entry.filename}`);
			}
			seen.add(entry.filename);
			yield entry;
		}
	}

	/**
	 * エントリの内容を destPath に新規ファイルとして書き出します。
	 * 失敗した場合は書きかけのファイルを削除してから例外を投げます。
	 */
	public async extractToFile(entry: FileEntry, destPath: string, options: ZipExtractOptions): Promise<void> {
		const { maxBytes } = options;

		if (entry.symlink) {
			throw new ZipExtractError(`symbolic link entry is not allowed: ${entry.filename}`);
		}
		if (entry.encrypted) {
			throw new ZipExtractError(`encrypted entry is not allowed: ${entry.filename}`);
		}
		if (entry.uncompressedSize > maxBytes) {
			throw new ZipExtractError(`entry is too large: ${entry.filename} (${entry.uncompressedSize} > ${maxBytes} bytes)`);
		}

		// 'wx' (O_CREAT | O_EXCL): destPath に既にファイルやシンボリックリンクがあれば失敗させ、必ず新規の通常ファイルを作る
		const handle = await fsp.open(destPath, 'wx');
		let succeeded = false;
		try {
			let written = 0;
			await entry.getData(new WritableStream<Uint8Array>({
				async write(chunk) {
					written += chunk.byteLength;
					if (written > maxBytes) {
						// ヘッダのサイズは偽装できるため、実際に書き出したバイト数でも打ち切る
						throw new ZipExtractError(`entry is too large: ${entry.filename} (> ${maxBytes} bytes)`);
					}
					await writeAll(handle, chunk);
				},
			}));
			succeeded = true;
		} finally {
			await handle.close();
			if (!succeeded) {
				await fsp.rm(destPath, { force: true });
			}
		}
	}

	public async close(): Promise<void> {
		await this.reader.close();
		await this.handle.close();
	}
}
