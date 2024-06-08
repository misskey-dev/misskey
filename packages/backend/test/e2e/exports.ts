/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, port, post, signup, startJobQueue } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('export-clips', () => {
	let queue: INestApplicationContext;
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	// XXX: Any better way to get the result?
	async function pollFirstDriveFile() {
		while (true) {
			const files = (await api('drive/files', {}, alice)).body;
			if (!files.length) {
				await new Promise(r => setTimeout(r, 100));
				continue;
			}
			if (files.length > 1) {
				throw new Error('Too many files?');
			}
			const file = (await api('drive/files/show', { fileId: files[0].id }, alice)).body;
			const res = await fetch(new URL(new URL(file.url).pathname, `http://127.0.0.1:${port}`));
			return await res.json();
		}
	}

	beforeAll(async () => {
		queue = await startJobQueue();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await queue.close();
	});

	beforeEach(async () => {
		// Clean all clips and files of alice
		const clips = (await api('clips/list', {}, alice)).body;
		for (const clip of clips) {
			const res = await api('clips/delete', { clipId: clip.id }, alice);
			if (res.status !== 204) {
				throw new Error('Failed to delete clip');
			}
		}
		const files = (await api('drive/files', {}, alice)).body;
		for (const file of files) {
			const res = await api('drive/files/delete', { fileId: file.id }, alice);
			if (res.status !== 204) {
				throw new Error('Failed to delete file');
			}
		}
	});

	test('basic export', async () => {
		let res = await api('clips/create', {
			name: 'foo',
			description: 'bar',
		}, alice);
		assert.strictEqual(res.status, 200);

		res = await api('i/export-clips', {}, alice);
		assert.strictEqual(res.status, 204);

		const exported = await pollFirstDriveFile();
		assert.strictEqual(exported[0].name, 'foo');
		assert.strictEqual(exported[0].description, 'bar');
		assert.strictEqual(exported[0].clipNotes.length, 0);
	});

	test('export with notes', async () => {
		let res = await api('clips/create', {
			name: 'foo',
			description: 'bar',
		}, alice);
		assert.strictEqual(res.status, 200);
		const clip = res.body;

		const note1 = await post(alice, {
			text: 'baz1',
		});

		const note2 = await post(alice, {
			text: 'baz2',
			poll: {
				choices: ['sakura', 'izumi', 'ako'],
			},
		});

		for (const note of [note1, note2]) {
			res = await api('clips/add-note', {
				clipId: clip.id,
				noteId: note.id,
			}, alice);
			assert.strictEqual(res.status, 204);
		}

		res = await api('i/export-clips', {}, alice);
		assert.strictEqual(res.status, 204);

		const exported = await pollFirstDriveFile();
		assert.strictEqual(exported[0].name, 'foo');
		assert.strictEqual(exported[0].description, 'bar');
		assert.strictEqual(exported[0].clipNotes.length, 2);
		assert.strictEqual(exported[0].clipNotes[0].note.text, 'baz1');
		assert.strictEqual(exported[0].clipNotes[1].note.text, 'baz2');
		assert.deepStrictEqual(exported[0].clipNotes[1].note.poll.choices[0], 'sakura');
	});

	test('multiple clips', async () => {
		let res = await api('clips/create', {
			name: 'kawaii',
			description: 'kawaii',
		}, alice);
		assert.strictEqual(res.status, 200);
		const clip1 = res.body;

		res = await api('clips/create', {
			name: 'yuri',
			description: 'yuri',
		}, alice);
		assert.strictEqual(res.status, 200);
		const clip2 = res.body;

		const note1 = await post(alice, {
			text: 'baz1',
		});

		const note2 = await post(alice, {
			text: 'baz2',
		});

		res = await api('clips/add-note', {
			clipId: clip1.id,
			noteId: note1.id,
		}, alice);
		assert.strictEqual(res.status, 204);

		res = await api('clips/add-note', {
			clipId: clip2.id,
			noteId: note2.id,
		}, alice);
		assert.strictEqual(res.status, 204);

		res = await api('i/export-clips', {}, alice);
		assert.strictEqual(res.status, 204);

		const exported = await pollFirstDriveFile();
		assert.strictEqual(exported[0].name, 'kawaii');
		assert.strictEqual(exported[0].clipNotes.length, 1);
		assert.strictEqual(exported[0].clipNotes[0].note.text, 'baz1');
		assert.strictEqual(exported[1].name, 'yuri');
		assert.strictEqual(exported[1].clipNotes.length, 1);
		assert.strictEqual(exported[1].clipNotes[0].note.text, 'baz2');
	});

	test('Clipping other user\'s note', async () => {
		let res = await api('clips/create', {
			name: 'kawaii',
			description: 'kawaii',
		}, alice);
		assert.strictEqual(res.status, 200);
		const clip = res.body;

		const note = await post(bob, {
			text: 'baz',
			visibility: 'followers',
		});

		res = await api('clips/add-note', {
			clipId: clip.id,
			noteId: note.id,
		}, alice);
		assert.strictEqual(res.status, 204);

		res = await api('i/export-clips', {}, alice);
		assert.strictEqual(res.status, 204);

		const exported = await pollFirstDriveFile();
		assert.strictEqual(exported[0].name, 'kawaii');
		assert.strictEqual(exported[0].clipNotes.length, 1);
		assert.strictEqual(exported[0].clipNotes[0].note.text, 'baz');
		assert.strictEqual(exported[0].clipNotes[0].note.user.username, 'bob');
	});
});
