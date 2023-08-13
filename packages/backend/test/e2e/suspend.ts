/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { loadConfig } from '@/config.js';
import { User, UsersRepository } from '@/models/index.js';
import { jobQueue } from '@/boot/common.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { uploadFile, signup, startServer, initTestDb, api, sleep, successfulApiCall } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('Account Suspension', () => {
	let app: INestApplicationContext;

	let root: misskey.entities.MeSignup;
	let alice: misskey.entities.MeSignup;

	beforeAll(async () => {
		app = await startServer();
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });

		await api('admin/suspend-user', { userId: alice.id }, root);
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	it('Cannot create notes', async () => {
		const res = await api('notes/create', { text: 'foo' }, alice);

		assert.strictEqual(res.status, 403);
		assert.strictEqual(res.body.error.code, 'YOUR_ACCOUNT_SUSPENDED');
		assert.strictEqual(res.body.error.id, 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370');
	});

	it('Can see notes', async () => {
		const createRes = await api('notes/create', { text: 'bar' }, root);
		assert.strictEqual(createRes.status, 200);
		assert.strictEqual(createRes.body.createdNote.text, 'bar');

		const showRes = await api('notes/show', { noteId: createRes.body.createdNote.id }, alice);
		assert.strictEqual(showRes.status, 200);
		assert.strictEqual(showRes.body.text, 'bar');
		assert.strictEqual(showRes.body.id, createRes.body.createdNote.id);
	});
});
