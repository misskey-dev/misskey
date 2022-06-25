process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { async, signup, request, post, uploadFile, startServer, shutdownServer } from './utils.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

describe('users/notes', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let jpgNote: any;
	let pngNote: any;
	let jpgPngNote: any;

	before(async () => {
		p = await startServer();
		console.log(`signup alice`);
		alice = await signup({ username: 'alice' });
		console.log(`jpg`);
		const jpg = await uploadFile(alice, _dirname + '/resources/Lenna.jpg');
		console.log(`png`);
		const png = await uploadFile(alice, _dirname + '/resources/Lenna.png');
		console.log(`jpgNote`);
		jpgNote = await post(alice, {
			fileIds: [jpg.id],
		});
		console.log(`pngNote`);
		pngNote = await post(alice, {
			fileIds: [png.id],
		});
		console.log(`jpgPngNote`);
		jpgPngNote = await post(alice, {
			fileIds: [jpg.id, png.id],
		});
	});

	after(async() => {
		await shutdownServer(p);
	});

	it('ファイルタイプ指定 (jpg)', async(async () => {
		const res = await request('/users/notes', {
			userId: alice.id,
			fileType: ['image/jpeg'],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 2);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
	}));

	it('ファイルタイプ指定 (jpg or png)', async(async () => {
		const res = await request('/users/notes', {
			userId: alice.id,
			fileType: ['image/jpeg', 'image/png'],
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 3);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === pngNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
	}));
});
