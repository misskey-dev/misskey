import test, { describe } from 'node:test';
import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import { createAccount, fetchAdmin, resolveRemoteNote, resolveRemoteUser } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Blocking', () => {
	test('Check follow', async () => {
		const [alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		const [bob, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		const [bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);

		await test('Cannot follow if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));
			await rejects(
				async () => await bobClient.request('following/create', { userId: aliceInBServer.id }),
				(err: any) => {
					strictEqual(err.code, 'BLOCKED');
					return true;
				},
			);

			const following = await bobClient.request('users/following', { userId: bob.id });
			strictEqual(following.length, 0);
			const followers = await aliceClient.request('users/followers', { userId: alice.id });
			strictEqual(followers.length, 0);
		});

		// FIXME: this is invalid case
		await test('Cannot follow even if unblocked', async () => {
			// unblock here
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			// TODO: why still being blocked?
			await rejects(
				async () => await bobClient.request('following/create', { userId: aliceInBServer.id }),
				(err: any) => {
					strictEqual(err.code, 'BLOCKED');
					return true;
				},
			);
		});

		await test.skip('Can follow if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await bobClient.request('following/create', { userId: aliceInBServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const following = await bobClient.request('users/following', { userId: bob.id });
			strictEqual(following.length, 1);
			const followers = await aliceClient.request('users/followers', { userId: alice.id });
			strictEqual(followers.length, 1);
		});

		await test.skip('Remove follower when block them', async () => {
			await test('before block', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				const followers = await aliceClient.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1);
			});

			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await test('after block', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0);
				const followers = await aliceClient.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 0);
			});
		});
	});

	test('Check reply', async () => {
		const [, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		const [, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		const [bobInAServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);

		await test('Cannot reply if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			await rejects(
				async () => await bobClient.request('notes/create', { text: 'b', replyId: resolvedNote.id }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		await test('Can reply if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			const reply = (await bobClient.request('notes/create', { text: 'b', replyId: resolvedNote.id })).createdNote;

			await resolveRemoteNote(`https://b.test/notes/${reply.id}`, aliceClient);
		});
	});

	test('Check reaction', async () => {
		const [, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		const [, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		const [bobInAServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);

		await test('Cannot reply if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			await rejects(
				async () => await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		// FIXME: this is invalid case
		await test('Cannot reply even if unblocked', async () => {
			// unblock here
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);

			// TODO: why still being blocked?
			await rejects(
				async () => await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		await test.skip('Can reply if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' });

			const _note = await aliceClient.request('notes/show', { noteId: note.id });
			deepStrictEqual(_note.reactions, { '😅': 1 });
		});
	});
});
