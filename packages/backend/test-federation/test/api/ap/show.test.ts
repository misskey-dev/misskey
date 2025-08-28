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
		test('resolve by acct (bob@b.test)', async () => {
			const res = await alice.client.request('ap/show', { uri: `${bob.username}@b.test` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve by canonical user URL (https://b.test/users/:id)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://b.test/users/${bob.id}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve by cross-origin non-canonical URL (https://a.test/@bob@b.test)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://a.test/@${bob.username}@b.test` });
			strictEqual(res.type, 'User');
			// 非正規URLから正規IDに追従して同一ユーザーになること
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('onlyUriFetch=true with acct string returns generic fetch error', async () => {
			await rejects(
				async () => await alice.client.request('ap/show', { uri: `${bob.username}@b.test`, onlyUriFetch: true }),
				(err: any) => {
					strictEqual(err.code, 'URI_IS_ACCT_LIKE_BUT_THIS_IS_ONLY_URI_FETCH_MODE');
					return true;
				},
			);
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
