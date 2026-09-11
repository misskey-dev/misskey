/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BlobWriter, TextReader, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js';
import { ZipExtractError, ZipFile } from '@/misc/zip.js';

type TestEntry = {
	name: string;
	data: string | Uint8Array;
	unixMode?: number;
};

const S_IFLNK = 0o120000;

async function buildZip(entries: TestEntry[]): Promise<Uint8Array> {
	const writer = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false });
	for (const entry of entries) {
		const reader = typeof entry.data === 'string' ? new TextReader(entry.data) : new Uint8ArrayReader(entry.data);
		await writer.add(entry.name, reader, entry.unixMode != null ? { unixMode: entry.unixMode } : {});
	}
	const blob = await writer.close();
	return new Uint8Array(await blob.arrayBuffer());
}

/**
 * ローカルファイルヘッダとセントラルディレクトリに記録された uncompressed size を書き換える (1 エントリの ZIP 専用)
 */
function forgeUncompressedSize(zip: Uint8Array, size: number): Uint8Array {
	const forged = new Uint8Array(zip);
	const view = new DataView(forged.buffer, forged.byteOffset, forged.byteLength);
	let patched = 0;
	for (let i = 0; i + 4 <= forged.byteLength; i++) {
		const signature = view.getUint32(i, true);
		if (signature === 0x04034b50) { // local file header
			view.setUint32(i + 22, size, true);
			patched++;
		} else if (signature === 0x02014b50) { // central directory file header
			view.setUint32(i + 24, size, true);
			patched++;
		}
	}
	expect(patched).toBe(2);
	return forged;
}

async function findEntry(zip: ZipFile, name: string) {
	for await (const entry of zip.entries()) {
		if (entry.filename === name) return entry;
	}
	return null;
}

async function listNames(zip: ZipFile): Promise<string[]> {
	const names: string[] = [];
	for await (const entry of zip.entries()) names.push(entry.filename);
	return names.sort();
}

describe('misc:zip', () => {
	let dir: string;

	async function writeZip(entries: TestEntry[] | Uint8Array): Promise<string> {
		const zipPath = path.join(dir, 'test.zip');
		await fs.promises.writeFile(zipPath, entries instanceof Uint8Array ? entries : await buildZip(entries));
		return zipPath;
	}

	beforeEach(async () => {
		dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'misskey-zip-test-'));
	});

	afterEach(async () => {
		await fs.promises.rm(dir, { recursive: true, force: true });
	});

	test('lists file entries and extracts them', async () => {
		const image = new Uint8Array(70000);
		for (let i = 0; i < image.length; i++) image[i] = (i * 31) & 0xff;
		const zipPath = await writeZip([
			{ name: 'meta.json', data: '{"metaVersion":2,"emojis":[]}' },
			{ name: 'sub/', data: '' },
			{ name: 'sub/nested.txt', data: 'nested' },
			{ name: 'ok.png', data: image },
		]);

		const zip = await ZipFile.open(zipPath);
		try {
			expect(await listNames(zip)).toEqual(['meta.json', 'ok.png', 'sub/nested.txt']);

			const metaPath = path.join(dir, 'meta.json');
			await zip.extractToFile((await findEntry(zip, 'meta.json'))!, metaPath, { maxBytes: 1024 });
			expect(await fs.promises.readFile(metaPath, 'utf-8')).toBe('{"metaVersion":2,"emojis":[]}');

			const imagePath = path.join(dir, 'ok.png');
			await zip.extractToFile((await findEntry(zip, 'ok.png'))!, imagePath, { maxBytes: image.length });
			expect(new Uint8Array(await fs.promises.readFile(imagePath))).toEqual(image);
			expect((await fs.promises.lstat(imagePath)).isFile()).toBe(true);
		} finally {
			await zip.close();
		}
	});

	test('rejects symbolic link entries', async () => {
		const zipPath = await writeZip([
			{ name: 'meta.json', data: '{}' },
			{ name: 'passwd', data: '/etc/passwd', unixMode: S_IFLNK | 0o777 },
		]);

		const zip = await ZipFile.open(zipPath);
		try {
			const entry = (await findEntry(zip, 'passwd'))!;
			expect(entry.symlink).toBe(true);

			const dest = path.join(dir, 'passwd');
			await expect(zip.extractToFile(entry, dest, { maxBytes: 1024 })).rejects.toThrow(ZipExtractError);
			expect(fs.existsSync(dest)).toBe(false);
		} finally {
			await zip.close();
		}
	});

	test('rejects archives containing path traversal entries', async () => {
		const zipPath = await writeZip([
			{ name: 'meta.json', data: '{}' },
			{ name: '../../evil.txt', data: 'evil' },
		]);

		const zip = await ZipFile.open(zipPath);
		try {
			await expect(listNames(zip)).rejects.toThrow('Unsafe filename');
		} finally {
			await zip.close();
		}
	});

	test('rejects archives containing absolute path entries', async () => {
		const zipPath = await writeZip([
			{ name: 'meta.json', data: '{}' },
			{ name: '/etc/evil.txt', data: 'evil' },
		]);

		const zip = await ZipFile.open(zipPath);
		try {
			await expect(listNames(zip)).rejects.toThrow('Unsafe filename');
		} finally {
			await zip.close();
		}
	});

	test('rejects archives containing duplicate entry names', async () => {
		// ZipWriter は重複名を許さないので、'b.png' を 'a.png' に書き換えて重複させる
		const zip = await buildZip([
			{ name: 'a.png', data: 'first' },
			{ name: 'b.png', data: 'second' },
		]);
		const text = new TextDecoder('latin1').decode(zip);
		expect(text.split('b.png').length - 1).toBe(2); // local file header + central directory
		const forged = new Uint8Array(zip);
		for (let i = text.indexOf('b.png'); i !== -1; i = text.indexOf('b.png', i + 1)) {
			forged[i] = 'a'.charCodeAt(0);
		}
		const zipPath = await writeZip(forged);

		const file = await ZipFile.open(zipPath);
		try {
			await expect(listNames(file)).rejects.toThrow('duplicate entry');
		} finally {
			await file.close();
		}
	});

	test('rejects non-zip files', async () => {
		const zipPath = path.join(dir, 'not-a-zip.zip');
		await fs.promises.writeFile(zipPath, 'this is not a zip file');

		const zip = await ZipFile.open(zipPath);
		try {
			await expect(listNames(zip)).rejects.toThrow();
		} finally {
			await zip.close();
		}
	});

	test('can iterate entries repeatedly and extract during iteration with many entries', async () => {
		const count = 5000;
		const entries: TestEntry[] = [];
		for (let i = 0; i < count; i++) entries.push({ name: `e${i}.png`, data: `emoji ${i}` });
		entries.push({ name: 'meta.json', data: '{"metaVersion":2}' });
		const zipPath = await writeZip(entries);

		const zip = await ZipFile.open(zipPath);
		try {
			// 1. meta.json だけを取り出す
			let seen = 0;
			for await (const entry of zip.entries()) {
				seen++;
				if (entry.filename === 'meta.json') {
					await zip.extractToFile(entry, path.join(dir, 'meta.json'), { maxBytes: 1024 });
				}
			}
			expect(seen).toBe(count + 1);
			expect(await fs.promises.readFile(path.join(dir, 'meta.json'), 'utf-8')).toBe('{"metaVersion":2}');

			// 2. 任意のエントリを取り出す
			const wanted = new Set(['e0.png', 'e2500.png', `e${count - 1}.png`]);
			for await (const entry of zip.entries()) {
				if (!wanted.has(entry.filename)) continue;
				await zip.extractToFile(entry, path.join(dir, entry.filename), { maxBytes: 1024 });
			}
			expect(await fs.promises.readFile(path.join(dir, 'e2500.png'), 'utf-8')).toBe('emoji 2500');
			expect(await fs.promises.readFile(path.join(dir, `e${count - 1}.png`), 'utf-8')).toBe(`emoji ${count - 1}`);
		} finally {
			await zip.close();
		}
	});

	test('rejects entries whose declared size exceeds maxBytes', async () => {
		const zipPath = await writeZip([
			{ name: 'big.bin', data: new Uint8Array(1024 * 1024) },
		]);

		const zip = await ZipFile.open(zipPath);
		try {
			const dest = path.join(dir, 'big.bin');
			await expect(zip.extractToFile((await findEntry(zip, 'big.bin'))!, dest, { maxBytes: 64 * 1024 })).rejects.toThrow(ZipExtractError);
			expect(fs.existsSync(dest)).toBe(false);
		} finally {
			await zip.close();
		}
	});

	test('stops writing when the actual size exceeds maxBytes even if the header lies', async () => {
		const forged = forgeUncompressedSize(await buildZip([
			{ name: 'bomb.bin', data: new Uint8Array(1024 * 1024) },
		]), 10);
		const zipPath = await writeZip(forged);

		const zip = await ZipFile.open(zipPath);
		try {
			const entry = (await findEntry(zip, 'bomb.bin'))!;
			expect(entry.uncompressedSize).toBe(10);

			// zip.js が伸長中にヘッダのサイズとの不一致を検出して打ち切る (ERR_INVALID_UNCOMPRESSED_SIZE)。
			// それをすり抜けた場合でも extractToFile 側の書き出しバイト数の検査で打ち切られる
			const dest = path.join(dir, 'bomb.bin');
			await expect(zip.extractToFile(entry, dest, { maxBytes: 64 * 1024 })).rejects.toThrow();
			expect(fs.existsSync(dest)).toBe(false);
		} finally {
			await zip.close();
		}
	});

	test('never writes through an existing symbolic link at the destination', async () => {
		const zipPath = await writeZip([
			{ name: 'ok.txt', data: 'overwritten?' },
		]);
		const target = path.join(dir, 'target.txt');
		await fs.promises.writeFile(target, 'original');
		const dest = path.join(dir, 'ok.txt');
		await fs.promises.symlink(target, dest);

		const zip = await ZipFile.open(zipPath);
		try {
			await expect(zip.extractToFile((await findEntry(zip, 'ok.txt'))!, dest, { maxBytes: 1024 })).rejects.toThrow(/EEXIST/);
			expect(await fs.promises.readFile(target, 'utf-8')).toBe('original');
			expect((await fs.promises.lstat(dest)).isSymbolicLink()).toBe(true);
		} finally {
			await zip.close();
		}
	});
});
