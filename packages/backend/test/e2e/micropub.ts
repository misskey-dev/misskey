/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as fs from 'node:fs/promises';
import * as assert from 'node:assert';
import { Repository } from 'typeorm';
import { JSDOM } from 'jsdom';
import * as misskey from 'misskey-js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { port, origin, api, initTestDb, signup, uploadFile, createAppToken, failedApiCall } from '../utils.js';

const host = new URL(`http://127.0.0.1:${port}`);

describe('Micropub', () => {
	let driveFiles: Repository<MiDriveFile>;
	let alice: misskey.entities.SignupResponse;

	beforeAll(async () => {
		const connection = await initTestDb(true);
		driveFiles = connection.getRepository(MiDriveFile);
		alice = await signup({ username: 'alice' });
	}, 1000 * 60 * 2);

	// https://micropub.spec.indieweb.org/#x3-3-create
	test('Posting note', async () => {
		const lenna = (await uploadFile(alice)).body;
		if (!lenna) return;
		const file = await driveFiles.findOneByOrFail({ id: lenna.id });
		const response = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: JSON.stringify({
				type: ['h-entry'],
				properties: {
					content: ['Hello world'],
					category: ['foo', 'bar'],
					photos: [new URL('/files/' + file.accessKey, origin).toString(), 'https://assets.misskey-hub.net/public/icon.png'],
				},
			}),
			headers: {
				'Authorization': 'Bearer ' + alice.token,
				'Content-Type': 'application/json',
			},
		});

		const createdNote = response.headers.get('Location');
		const noteUrl = createdNote ? new URL(createdNote) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(noteUrl?.origin, origin);
		assert.ok(noteUrl.pathname.startsWith('/notes/'));

		const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
		assert.strictEqual(note.text, 'Hello world #foo #bar');
		assert.deepStrictEqual(note.tags, ['foo', 'bar']);
		assert.strictEqual(note.fileIds.length, 2);
		assert.ok(note.fileIds.includes(file.id));
	});

	// https://micropub.spec.indieweb.org/#x3-3-create
	test('Posting note using HTML', async () => {
		const lenna = (await uploadFile(alice)).body;
		if (!lenna) return;
		const file = await driveFiles.findOneByOrFail({ id: lenna.id });
		const response = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: JSON.stringify({
				type: ['h-entry'],
				properties: {
					content: [{ html: `Hello!<image src="${new URL('/files/' + file.webpublicAccessKey, origin).toString()}"></image>` }],
				},
			}),
			headers: {
				'Authorization': 'Bearer ' + alice.token,
				'Content-Type': 'application/json',
			},
		});

		const createdNote = response.headers.get('Location');
		const noteUrl = createdNote ? new URL(createdNote) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(noteUrl?.origin, origin);
		assert.ok(noteUrl.pathname.startsWith('/notes/'));

		const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
		assert.strictEqual(note.text, 'Hello!');
		assert.strictEqual(note.fileIds.length, 1);
		assert.ok(note.fileIds.includes(file.id));
	});

	// https://micropub.spec.indieweb.org/#x3-3-create
	test('Posting note using application/x-www-form-urlencoded', async () => {
		const params = new URLSearchParams();
		params.append('h', 'entry');
		params.append('access_token', alice.token);
		params.append('content', 'Hello world');
		params.append('category[]', 'foo');
		params.append('category[]', 'bar');

		const response = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: params,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const createdNote = response.headers.get('Location');
		const noteUrl = createdNote ? new URL(createdNote) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(noteUrl?.origin, origin);
		assert.ok(noteUrl.pathname.startsWith('/notes/'));
	});

	// // https://micropub.spec.indieweb.org/#x3-3-create
	test('Posting note using multipart/form-data', async () => {
		const lenna = new URL('../resources/Lenna.jpg', import.meta.url);
		const form = new FormData();
		form.append('h', 'entry');
		form.append('content', 'Hello world');
		form.append('access_token', alice.token);
		form.append('photo', new File([await fs.readFile(lenna)], 'Lenna.png'));

		const response = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: form,
		});

		const createdNote = response.headers.get('Location');
		const noteUrl = createdNote ? new URL(createdNote) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(noteUrl?.origin, origin);
		assert.ok(noteUrl.pathname.startsWith('/notes/'));

		const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
		assert.strictEqual(note.text, 'Hello world');
		assert.strictEqual(note.fileIds.length, 1);
	});

	describe('Updating note', () => {
		// https://micropub.spec.indieweb.org/#add
		test('Add fields to note', async () => {
			const params = new URLSearchParams();
			params.append('h', 'entry');
			params.append('access_token', alice.token);
			params.append('content', 'Hello world');
			params.append('category[]', 'foo');

			const response = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: params,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			const createdNote = response.headers.get('Location');
			assert.strictEqual(response.status, 201 /* Created */);
			assert.ok(createdNote);

			const response2 = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: JSON.stringify({
					action: 'update',
					url: createdNote,
					add: { category: ['bar', 'bazz'] },
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + alice.token,
				},
			});

			const createdNote2 = response2.headers.get('Location');
			const noteUrl = createdNote2 ? new URL(createdNote2) : null;
			assert.strictEqual(response2.status, 201 /* Created */);
			assert.strictEqual(noteUrl?.origin, origin);
			assert.ok(noteUrl.pathname.startsWith('/notes/'));

			const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
			assert.strictEqual(note.text, 'Hello world #foo #bar #bazz');
			assert.deepStrictEqual(note.tags, ['foo', 'bar', 'bazz']);
		});

		// https://micropub.spec.indieweb.org/#replace
		test('Replace fields in note', async () => {
			const params = new URLSearchParams();
			params.append('h', 'entry');
			params.append('access_token', alice.token);
			params.append('content', 'Hello world');

			const response = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: params,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			const createdNote = response.headers.get('Location');
			assert.strictEqual(response.status, 201 /* Created */);
			assert.ok(createdNote);

			const response2 = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: JSON.stringify({
					action: 'update',
					url: createdNote,
					replace: { content: ['Changed'] },
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + alice.token,
				},
			});

			const createdNote2 = response2.headers.get('Location');
			const noteUrl = createdNote2 ? new URL(createdNote2) : null;
			assert.strictEqual(response2.status, 201 /* Created */);
			assert.strictEqual(noteUrl?.origin, origin);
			assert.ok(noteUrl.pathname.startsWith('/notes/'));

			const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
			assert.strictEqual(note.text, 'Changed');
		});

		// https://micropub.spec.indieweb.org/#remove
		test('Remove fields from note', async () => {
			const params = new URLSearchParams();
			params.append('h', 'entry');
			params.append('access_token', alice.token);
			params.append('content', 'Hello world');
			params.append('category[]', 'foo');
			params.append('photos[]', 'https://assets.misskey-hub.net/public/icon.png');

			const response = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: params,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			const createdNote = response.headers.get('Location');
			assert.strictEqual(response.status, 201 /* Created */);
			assert.ok(createdNote);

			const response2 = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: JSON.stringify({
					action: 'update',
					url: createdNote,
					delete: ['category'],
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + alice.token,
				},
			});

			const createdNote2 = response2.headers.get('Location');
			const noteUrl = createdNote2 ? new URL(createdNote2) : null;
			assert.strictEqual(response2.status, 201 /* Created */);
			assert.strictEqual(noteUrl?.origin, origin);
			assert.ok(noteUrl.pathname.startsWith('/notes/'));

			const note = (await api('notes/show', { noteId: noteUrl!.pathname.slice(7) })).body;
			assert.strictEqual(note.tags, undefined);

			const response3 = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: JSON.stringify({
					action: 'update',
					url: createdNote2,
					delete: { photos: ['https://assets.misskey-hub.net/public/icon.png'] },
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + alice.token,
				},
			});

			const createdNote3 = response3.headers.get('Location');
			const noteUrl2 = createdNote3 ? new URL(createdNote3) : null;
			assert.strictEqual(response3.status, 201 /* Created */);
			assert.strictEqual(noteUrl2?.origin, origin);
			assert.ok(noteUrl2.pathname.startsWith('/notes/'));

			const note2 = (await api('notes/show', { noteId: noteUrl2!.pathname.slice(7) })).body;
			assert.strictEqual(note2.fileIds?.length, 0);
		});
	});

	// https://micropub.spec.indieweb.org/#delete
	test('Deleting note', async () => {
		const params = new URLSearchParams();
		params.append('h', 'entry');
		params.append('access_token', alice.token);
		params.append('content', 'Hello world');
		params.append('category[]', 'foo');

		const response = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: params,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const createdNote = response.headers.get('Location');
		assert.strictEqual(response.status, 201 /* Created */);
		assert.ok(createdNote);

		const noteId = new URL(createdNote).pathname.slice(7);
		const params2 = new URLSearchParams();
		params2.append('access_token', alice.token);
		params2.append('action', 'delete');
		params2.append('url', createdNote);

		const response2 = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: params2,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		assert.strictEqual(response2.status, 200 /* OK */);

		await failedApiCall({
			endpoint: '/notes/show',
			parameters: { noteId },
			user: alice,
		}, {
			status: 400,
			code: 'NO_SUCH_NOTE',
			id: '24fcbfc6-2e37-42b6-8388-c29b3861a08d',
		});
	});

	test('Authorization', async () => {
		const application = await createAppToken(alice, []);
		const lenna = new URL('../resources/Lenna.jpg', import.meta.url);
		const form = new FormData();
		form.append('access_token', application);
		form.append('file', new File([await fs.readFile(lenna)], 'Lenna.png'));

		const response = await fetch(new URL('/micropub/media', host), {
			method: 'POST',
			body: form,
		}).then(async res => ({ body: await res.json(), status: res.status }));

		assert.strictEqual(response.status, 403 /* Forbidden */);
		assert.strictEqual(response.body.error, 'insufficient_scope');

		const params = new URLSearchParams();
		params.append('h', 'entry');
		params.append('access_token', application);
		params.append('content', 'Hello world');

		const response2 = await fetch(new URL('/micropub/micropub', host), {
			method: 'POST',
			body: params,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		}).then(async res => ({ body: await res.json(), status: res.status }));

		assert.strictEqual(response2.status, 403 /* Forbidden */);
		assert.strictEqual(response2.body.error, 'insufficient_scope');
	});

	// https://micropub.spec.indieweb.org/#media-endpoint
	test('Uploading file', async () => {
		const lenna = new URL('../resources/Lenna.jpg', import.meta.url);
		const form = new FormData();
		form.append('access_token', alice.token);
		form.append('file', new File([await fs.readFile(lenna)], 'Lenna.png'));

		const response = await fetch(new URL('/micropub/media', host), {
			method: 'POST',
			body: form,
		});

		const createdFile = response.headers.get('Location');
		const createdFileUrl = createdFile ? new URL(createdFile) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(createdFileUrl?.origin, origin);
		assert.ok(createdFileUrl.pathname.startsWith('/files/'));

		const driveFile = await driveFiles.findOneBy({ accessKey: createdFileUrl.pathname.slice(7) });
		assert.ok(driveFile);
	});

	// https://micropub.spec.indieweb.org/#media-endpoint
	test('Uploading file with authorization header', async () => {
		const lenna = new URL('../resources/Lenna.jpg', import.meta.url);
		const form = new FormData();
		form.append('file', new File([await fs.readFile(lenna)], 'Lenna.png'));

		const response = await fetch(new URL('/micropub/media', host), {
			method: 'POST',
			body: form,
			headers: { authorization: `Bearer ${alice.token}` },
		});

		const createdFile = response.headers.get('Location');
		const createdFileUrl = createdFile ? new URL(createdFile) : null;

		assert.strictEqual(response.status, 201 /* Created */);
		assert.strictEqual(createdFileUrl?.origin, origin);
		assert.ok(createdFileUrl.pathname.startsWith('/files/'));
	});

	// https://micropub.spec.indieweb.org/#querying
	describe('Querying', () => {
		// https://micropub.spec.indieweb.org/#configuration
		// https://micropub.spec.indieweb.org/#syndication-targets
		test('Configuration, Syndication targets', async () => {
			const configUrl = new URL('/micropub/micropub', host);
			configUrl.search = new URLSearchParams({ q: 'config' }).toString();

			const config = await fetch(configUrl, { method: 'GET' }).then(res => res.json());
			const mediaEndpoint = config['media-endpoint'] ? new URL(config['media-endpoint']) : null;

			assert.strictEqual(config['syndicate-to']?.length, 0);
			assert.strictEqual(mediaEndpoint?.origin, origin);
			assert.strictEqual(mediaEndpoint.pathname, '/micropub/media');

			configUrl.search = new URLSearchParams({ q: 'syndicate-to' }).toString();
			const syndicateTo = await fetch(configUrl, { method: 'GET' }).then(res => res.json());
			assert.strictEqual(syndicateTo['syndicate-to']?.length, 0);
		});

		// https://micropub.spec.indieweb.org/#source-content
		test('Source content', async () => {
			const params = new URLSearchParams();
			params.append('h', 'entry');
			params.append('access_token', alice.token);
			params.append('content', 'Hello world');
			params.append('category[]', 'foo');
			params.append('category[]', 'bar');

			const response = await fetch(new URL('/micropub/micropub', host), {
				method: 'POST',
				body: params,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			const createdNote = response.headers.get('Location');
			const noteUrl = createdNote ? new URL(createdNote) : null;

			assert.strictEqual(response.status, 201 /* Created */);
			assert.strictEqual(noteUrl?.origin, origin);
			assert.ok(noteUrl.pathname.startsWith('/notes/'));

			const configUrl = new URL('/micropub/micropub', host);
			configUrl.search = new URLSearchParams({ q: 'source', url: noteUrl.toString() }).toString();

			const response2 = await fetch(configUrl, {
				method: 'GET',
				headers: { authorization: 'Bearer ' + alice.token },
			}).then(async res => ({ status: res.status, body: await res.json() }));

			assert.strictEqual(response2.status, 200 /* OK */);
			assert.deepEqual(response2.body.type, ['h-entry']);
			assert.deepEqual(response2.body.properties.content, ['Hello world']);
			assert.deepEqual(response2.body.properties.category, ['foo', 'bar']);

			configUrl.search = new URLSearchParams({
				q: 'source',
				url: noteUrl.toString(),
				properties: 'category',
			}).toString();

			const response3 = await fetch(configUrl, {
				method: 'GET',
				headers: { authorization: 'Bearer ' + alice.token },
			}).then(async res => ({ status: res.status, body: await res.json() }));

			assert.strictEqual(response3.status, 200 /* OK */);
			assert.deepEqual(response3.body, { properties: { category: ['foo', 'bar'] } });
		});
	});

	// https://micropub.spec.indieweb.org/#x5-3-endpoint-discovery
	test('Endpoint discovery', async () => {
		const html = await fetch(host).then(response => response.text());
		const fragment = JSDOM.fragment(html);
		const micropubEndpoint = new URL('/micropub/micropub', origin);
		const rawEndpoint = fragment.querySelector<HTMLLinkElement>('link[rel="micropub"]')?.getAttribute('href');
		const maybeEndpoint = rawEndpoint ? new URL(rawEndpoint) : null;

		assert.strictEqual(maybeEndpoint?.origin, micropubEndpoint.origin);
		assert.strictEqual(maybeEndpoint.pathname, micropubEndpoint.pathname);
	});
});
