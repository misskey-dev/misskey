/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { constants as fsConstants, promises as fsp } from 'node:fs';
import { Reader, Writer, ZipReader, ZipWriter } from '@zip.js/zip.js';
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

/**
 * zip.js の Writer を Node.js の FileHandle で実装したもの
 */
class FileHandleWriter extends Writer<fsp.FileHandle> {
	constructor(private readonly handle: fsp.FileHandle) {
		super();
	}

	public override async writeUint8Array(array: Uint8Array): Promise<void> {
		await writeAll(this.handle, array);
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

export class ZipArchiveError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ZipArchiveError';
	}
}

/**
 * ZIP のエントリ名として安全でないものを弾く。
 *
 * zip.js の `filenameValidation` は読み取り側にしか無く、ZipWriter は渡された名前をそのまま格納する
 * (\ も区切り文字に変換されない) ため、ZipFile 相当の検査を書き出し側にも用意する。
 */
function assertSafeEntryName(name: string): void {
	// eslint-disable-next-line no-control-regex
	if (name === '' || /[\u0000-\u001f\u007f]/.test(name)) {
		throw new ZipArchiveError(`invalid entry name: ${JSON.stringify(name)}`);
	}
	// ZIP の区切り文字は '/' のみ。'\' を含む名前は展開ツールによって区切りとして解釈され得る
	if (name.includes('\\')) {
		throw new ZipArchiveError(`entry name must not contain a backslash: ${name}`);
	}
	// 絶対パス (POSIX / Windows のドライブレター)
	if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) {
		throw new ZipArchiveError(`entry name must be relative: ${name}`);
	}
	const parts = name.split('/');
	if (parts.includes('..') || parts.includes('.') || parts.includes('')) {
		throw new ZipArchiveError(`entry name must not contain a '.', '..' or empty path segment: ${name}`);
	}
}

/**
 * ZIP ファイルを書き出すためのラッパー
 */
export class ZipArchive {
	private constructor(
		private readonly handle: fsp.FileHandle,
		private readonly writer: ZipWriter<unknown>,
	) {}

	/**
	 * path に ZIP を作成します。既にファイルがある場合は切り詰めて上書きします。
	 */
	public static async create(path: string): Promise<ZipArchive> {
		// O_NOFOLLOW: path 自体がシンボリックリンクなら ELOOP で失敗させ、そのリンク先を切り詰めてしまうのを防ぐ
		const handle = await fsp.open(path, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_TRUNC | fsConstants.O_NOFOLLOW);
		try {
			const writer = new ZipWriter(new FileHandleWriter(handle), {
				// Node.js には Web Worker が無いのでインラインで処理する
				useWebWorkers: false,
				// 画像等の既に圧縮済みのデータを想定しているので無圧縮 (格納) にする
				level: 0,
				// エントリを一旦メモリに溜めてから書き出すのを防ぐ (add() を直列に呼ぶ限り既定値のまま false)
				bufferedWrite: false,
			});
			return new ZipArchive(handle, writer);
		} catch (e) {
			await handle.close();
			throw e;
		}
	}

	/**
	 * srcPath のファイルを name というエントリ名で追加します。
	 *
	 * bufferedWrite を無効に保つため、シーケンシャルに実行すること。
	 */
	public async addFile(name: string, srcPath: string): Promise<void> {
		assertSafeEntryName(name);

		// O_NOFOLLOW: srcPath がシンボリックリンクなら ELOOP で失敗させ、リンク先を ZIP に取り込むのを防ぐ
		const handle = await fsp.open(srcPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
		try {
			const stats = await handle.stat();
			// FIFO を開くと読み取りが永久にブロックし得るので、通常ファイル以外は受け付けない
			if (!stats.isFile()) {
				throw new ZipArchiveError(`not a regular file: ${srcPath}`);
			}
			// サイズを渡しておくと zip.js が不要な zip64 拡張を使わずに済む。
			// stat 後にファイルが変化しても、実際に読めたバイト数と CRC-32 がデータディスクリプタに記録されるため
			// ヘッダと中身が食い違う ZIP にはならない
			await this.writer.add(name, new FileHandleReader(handle, stats.size));
		} finally {
			await handle.close();
		}
	}

	/**
	 * セントラルディレクトリを書き出して ZIP を完成させます。
	 */
	public async close(): Promise<void> {
		try {
			await this.writer.close();
		} finally {
			await this.handle.close();
		}
	}

	/**
	 * 書きかけの ZIP を完成させずに破棄し、ファイルハンドルだけを閉じます。
	 *
	 * path のファイルは中途半端な状態で残るので、呼び出し側で始末すること。
	 */
	public async abort(): Promise<void> {
		await this.handle.close();
	}
}
