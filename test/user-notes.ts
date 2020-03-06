/*
 * Tests of Note
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/user-notes.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/user-notes.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, uploadFile, launchServer } from './utils';

describe('users/notes', () => {
	let p: childProcess.ChildProcess;

	let alice: any;
	let jpgNote: any;
	let pngNote: any;
	let jpgPngNote: any;

	before(launchServer(g => p = g, async () => {
		alice = await signup({ username: 'alice' });
		const jpg = await uploadFile(alice, __dirname + '/resources/Lenna.jpg');
		const png = await uploadFile(alice, __dirname + '/resources/Lenna.png');
		jpgNote = await post(alice, {
			fileIds: [jpg.id]
		});
		pngNote = await post(alice, {
			fileIds: [png.id]
		});
		jpgPngNote = await post(alice, {
			fileIds: [jpg.id, png.id]
		});
	}));

	after(() => {
		p.kill();
	});

	it('ファイルタイプ指定 (jpg)', async(async () => {
		const res = await request('/users/notes', {
			userId: alice.id,
			fileType: ['image/jpeg']
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
			fileType: ['image/jpeg', 'image/png']
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 3);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === pngNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
	}));
});
