import { strictEqual, rejects } from 'node:assert';
import { createAccount, resolveRemoteUser, sleep, type LoginUser } from '../../utils.js';

describe('API ap/show', () => {
	let alice: LoginUser, bob: LoginUser;

	beforeEach(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);
	});

	describe('User resolution', () => {
		test('resolve a remote user by canonical user url (https://b.test/users/:id)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://b.test/users/${bob.id}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve a remote user by user profile url (https://b.test/@bob)', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://b.test/@${bob.username}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('resolve a local user by local uri', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://a.test/users/${alice.id}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.id, alice.id);
		});

		test('resolve a local user by local profile url', async () => {
			const res = await alice.client.request('ap/show', { uri: `https://a.test/@${alice.username}` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.id, alice.id);
		});

		test('resolve a fetched remote user by local profile url (https://a.test/@bob@b.test)', async () => {
			await resolveRemoteUser('b.test', bob.id, alice);
			const res = await alice.client.request('ap/show', { uri: `https://a.test/@${bob.username}@b.test` });
			strictEqual(res.type, 'User');
			strictEqual(res.object.uri, `https://b.test/users/${bob.id}`);
		});

		test('throws in resolving a non-fetched remote user by local profile url (https://a.test/@bob@b.test)', async () => {
			// ユーザーがこのような問い合わせをすることは、ない！

			await rejects(
				async () => await alice.client.request('ap/show', { uri: `https://a.test/@${bob.username}@b.test` }),
				(err: any) => {
					strictEqual(err.code, 'NO_SUCH_OBJECT');
					return true;
				},
			);
		});
	});

	describe('Note resolution', () => {
		test('resolve a remote note by note uri', async () => {
			const note = (await bob.client.request('notes/create', { text: 'hello from Bob' })).createdNote;
			await sleep();

			const res = await alice.client.request('ap/show', { uri: `https://b.test/notes/${note.id}` });
			strictEqual(res.type, 'Note');
			strictEqual(res.object.uri, `https://b.test/notes/${note.id}`);
			// 投稿者が a.test 側で解決済みの Bob になること
			strictEqual(res.object.user.username, bob.username);
			strictEqual(res.object.user.host, 'b.test');
		});

		test('resolve a local note by note uri', async () => {
			const note = (await alice.client.request('notes/create', { text: 'hello from Alice' })).createdNote;
			await sleep();

			const res = await alice.client.request('ap/show', { uri: `https://a.test/notes/${note.id}` });
			strictEqual(res.type, 'Note');
			strictEqual(res.object.id, note.id);
			strictEqual(res.object.user.id, alice.id);
		});
	});
});
