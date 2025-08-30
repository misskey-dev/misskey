import { strictEqual, rejects } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, resolveRemoteUser, sleep, type LoginUser } from '../../utils.js';

describe('API ap/show', () => {
	let alice: LoginUser, bob: LoginUser;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);
	});

	describe('User resolution', () => {
		test('resolve by canonical user URL (https://b.test/users/:id)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://b.test/users/${bob.id}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve by user profile URL (https://b.test/@bob)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://b.test/@${bob.username}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve local user by local profile url', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://a.test/@${alice.username}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.id, alice.id);
		});

		test('resolve remote user by local profile URL (https://a.test/@bob@b.test)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://a.test/@${bob.username}@b.test` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});
	});

	describe('Note resolution', () => {
		test('resolve by note URL (https://b.test/notes/:id)', async () => {
			const note = (await bob.client.request('notes/create', { text: 'hello from Bob' })).createdNote;
			// 伝搬待ち
			await sleep();

			const res = await alice.client.request('ap/show', { uri: `https://b.test/notes/${note.id}` });
			strictEqual(res.type, 'Note');
			strictEqual(res.object.uri, `https://b.test/notes/${note.id}`);
			// 投稿者が a.test 側で解決済みの Bob になること
			strictEqual(res.object.user.username, bob.username);
			strictEqual(res.object.user.host, 'b.test');
		});
	});
});
