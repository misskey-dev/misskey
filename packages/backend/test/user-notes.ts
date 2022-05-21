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
		alice = await signup({ username: 'alice' });
		const jpg = await uploadFile(alice, _dirname + '/resources/Lenna.jpg');
		const png = await uploadFile(alice, _dirname + '/resources/Lenna.png');
		jpgNote = await post(alice, {
			fileIds: [jpg.id],
		});
		pngNote = await post(alice, {
			fileIds: [png.id],
		});
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
