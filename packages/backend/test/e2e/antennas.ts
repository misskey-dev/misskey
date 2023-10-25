/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { inspect } from 'node:util';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import type { Packed } from '@/misc/json-schema.js';
import {
	signup,
	post,
	userList,
	page,
	role,
	startServer,
	api,
	successfulApiCall,
	failedApiCall,
	uploadFile,
	testPaginationConsistency,
} from '../utils.js';
import type * as misskey from 'misskey-js';
import type { INestApplicationContext } from '@nestjs/common';

const compareBy = <T extends { id: string }>(selector: (s: T) => string = (s: T): string => s.id) => (a: T, b: T): number => {
	return selector(a).localeCompare(selector(b));
};

describe('アンテナ', () => {
	// エンティティとしてのアンテナを主眼においたテストを記述する
	// (Antennaを返すエンドポイント、Antennaエンティティを書き換えるエンドポイント、Antennaからノートを取得するエンドポイントをテストする)

	// BUG misskey-jsとjson-schemaが一致していない。
	// - srcのenumにgroupが残っている
	// - userGroupIdが残っている, isActiveがない
	type Antenna = misskey.entities.Antenna | Packed<'Antenna'>;
	type User = misskey.entities.MeSignup;
	type Note = misskey.entities.Note;

	// アンテナを作成できる最小のパラメタ
	const defaultParam = {
		caseSensitive: false,
		excludeKeywords: [['']],
		keywords: [['keyword']],
		name: 'test',
		notify: false,
		src: 'all' as const,
		userListId: null,
		users: [''],
		withFile: false,
		withReplies: false,
	};

	let app: INestApplicationContext;

	let root: User;
	let alice: User;
	let bob: User;
	let carol: User;

	let alicePost: Note;
	let aliceList: misskey.entities.UserList;
	let bobFile: misskey.entities.DriveFile;
	let bobList: misskey.entities.UserList;

	let userNotExplorable: User;
	let userLocking: User;
	let userSilenced: User;
	let userSuspended: User;
	let userDeletedBySelf: User;
	let userDeletedByAdmin: User;
	let userFollowingAlice: User;
	let userFollowedByAlice: User;
	let userBlockingAlice: User;
	let userBlockedByAlice: User;
	let userMutingAlice: User;
	let userMutedByAlice: User;

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
		alicePost = await post(alice, { text: 'test' });
		aliceList = await userList(alice, {});
		bob = await signup({ username: 'bob' });
		aliceList = await userList(alice, {});
		bobFile = (await uploadFile(bob)).body;
		bobList = await userList(bob);
		carol = await signup({ username: 'carol' });
		await api('users/lists/push', { listId: aliceList.id, userId: bob.id }, alice);
		await api('users/lists/push', { listId: aliceList.id, userId: carol.id }, alice);

		userNotExplorable = await signup({ username: 'userNotExplorable' });
		await post(userNotExplorable, { text: 'test' });
		await api('i/update', { isExplorable: false }, userNotExplorable);
		userLocking = await signup({ username: 'userLocking' });
		await post(userLocking, { text: 'test' });
		await api('i/update', { isLocked: true }, userLocking);
		userSilenced = await signup({ username: 'userSilenced' });
		await post(userSilenced, { text: 'test' });
		const roleSilenced = await role(root, {}, { canPublicNote: { priority: 0, useDefault: false, value: false } });
		await api('admin/roles/assign', { userId: userSilenced.id, roleId: roleSilenced.id }, root);
		userSuspended = await signup({ username: 'userSuspended' });
		await post(userSuspended, { text: 'test' });
		await successfulApiCall({ endpoint: 'i/update', parameters: { description: '#user_testuserSuspended' }, user: userSuspended });
		await api('admin/suspend-user', { userId: userSuspended.id }, root);
		userDeletedBySelf = await signup({ username: 'userDeletedBySelf', password: 'userDeletedBySelf' });
		await post(userDeletedBySelf, { text: 'test' });
		await api('i/delete-account', { password: 'userDeletedBySelf' }, userDeletedBySelf);
		userDeletedByAdmin = await signup({ username: 'userDeletedByAdmin' });
		await post(userDeletedByAdmin, { text: 'test' });
		await api('admin/delete-account', { userId: userDeletedByAdmin.id }, root);
		userFollowedByAlice = await signup({ username: 'userFollowedByAlice' });
		await post(userFollowedByAlice, { text: 'test' });
		await api('following/create', { userId: userFollowedByAlice.id }, alice);
		userFollowingAlice = await signup({ username: 'userFollowingAlice' });
		await post(userFollowingAlice, { text: 'test' });
		await api('following/create', { userId: alice.id }, userFollowingAlice);
		userBlockingAlice = await signup({ username: 'userBlockingAlice' });
		await post(userBlockingAlice, { text: 'test' });
		await api('blocking/create', { userId: alice.id }, userBlockingAlice);
		userBlockedByAlice = await signup({ username: 'userBlockedByAlice' });
		await post(userBlockedByAlice, { text: 'test' });
		await api('blocking/create', { userId: userBlockedByAlice.id }, alice);
		userMutingAlice = await signup({ username: 'userMutingAlice' });
		await post(userMutingAlice, { text: 'test' });
		await api('mute/create', { userId: alice.id }, userMutingAlice);
		userMutedByAlice = await signup({ username: 'userMutedByAlice' });
		await post(userMutedByAlice, { text: 'test' });
		await api('mute/create', { userId: userMutedByAlice.id }, alice);
	}, 1000 * 60 * 10);

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		// テスト間で影響し合わないように毎回全部消す。
		for (const user of [alice, bob]) {
			const list = await api('/antennas/list', {}, user);
			for (const antenna of list.body) {
				await api('/antennas/delete', { antennaId: antenna.id }, user);
			}
		}
	});

	//#region 作成(antennas/create)

	test('が作成できること、キーが過不足なく入っていること。', async () => {
		const response = await successfulApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam },
			user: alice,
		});
		assert.match(response.id, /[0-9a-z]{10}/);
		const expected = {
			id: response.id,
			caseSensitive: false,
			createdAt: new Date(response.createdAt).toISOString(),
			excludeKeywords: [['']],
			hasUnreadNote: false,
			isActive: true,
			keywords: [['keyword']],
			name: 'test',
			notify: false,
			src: 'all',
			userListId: null,
			users: [''],
			withFile: false,
			withReplies: false,
			localOnly: false,
		} as Antenna;
		assert.deepStrictEqual(response, expected);
	});

	test('が上限いっぱいまで作成できること', async () => {
		// antennaLimit + 1まで作れるのがキモ
		const response = await Promise.all([...Array(DEFAULT_POLICIES.antennaLimit + 1)].map(() => successfulApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam },
			user: alice,
		})));

		const expected = await successfulApiCall({ endpoint: 'antennas/list', parameters: {}, user: alice });
		assert.deepStrictEqual(
			response.sort(compareBy(s => s.id)),
			expected.sort(compareBy(s => s.id)));

		failedApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam },
			user: alice,
		}, {
			status: 400,
			code: 'TOO_MANY_ANTENNAS',
			id: 'faf47050-e8b5-438c-913c-db2b1576fde4',
		});
	});

	test('を作成するとき他人のリストを指定したらエラーになる', async () => {
		failedApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam, src: 'list', userListId: bobList.id },
			user: alice,
		}, {
			status: 400,
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
		});
	});

	const antennaParamPattern = [
		{ parameters: (): object => ({ name: 'x'.repeat(100) }) },
		{ parameters: (): object => ({ name: 'x' }) },
		{ parameters: (): object => ({ src: 'home' }) },
		{ parameters: (): object => ({ src: 'all' }) },
		{ parameters: (): object => ({ src: 'users' }) },
		{ parameters: (): object => ({ src: 'list' }) },
		{ parameters: (): object => ({ userListId: null }) },
		{ parameters: (): object => ({ src: 'list', userListId: aliceList.id }) },
		{ parameters: (): object => ({ keywords: [['x']] }) },
		{ parameters: (): object => ({ keywords: [['a', 'b', 'c'], ['x'], ['y'], ['z']] }) },
		{ parameters: (): object => ({ excludeKeywords: [['a', 'b', 'c'], ['x'], ['y'], ['z']] }) },
		{ parameters: (): object => ({ users: [alice.username] }) },
		{ parameters: (): object => ({ users: [alice.username, bob.username, carol.username] }) },
		{ parameters: (): object => ({ caseSensitive: false }) },
		{ parameters: (): object => ({ caseSensitive: true }) },
		{ parameters: (): object => ({ withReplies: false }) },
		{ parameters: (): object => ({ withReplies: true }) },
		{ parameters: (): object => ({ withFile: false }) },
		{ parameters: (): object => ({ withFile: true }) },
		{ parameters: (): object => ({ notify: false }) },
		{ parameters: (): object => ({ notify: true }) },
	];
	test.each(antennaParamPattern)('を作成できること($#)', async ({ parameters }) => {
		const response = await successfulApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam, ...parameters() },
			user: alice,
		});
		const expected = { ...response, ...parameters() };
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region 更新(antennas/update)

	test.each(antennaParamPattern)('を変更できること($#)', async ({ parameters }) => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/update',
			parameters: { antennaId: antenna.id, ...defaultParam, ...parameters() },
			user: alice,
		});
		const expected = { ...response, ...parameters() };
		assert.deepStrictEqual(response, expected);
	});
	test.todo('は他人のものは変更できない');

	test('を変更するとき他人のリストを指定したらエラーになる', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		failedApiCall({
			endpoint: 'antennas/update',
			parameters: { antennaId: antenna.id, ...defaultParam, src: 'list', userListId: bobList.id },
			user: alice,
		}, {
			status: 400,
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7',
		});
	});

	//#endregion
	//#region 表示(antennas/show)

	test('をID指定で表示できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/show',
			parameters: { antennaId: antenna.id },
			user: alice,
		});
		const expected = { ...antenna };
		assert.deepStrictEqual(response, expected);
	});
	test.todo('は他人のものをID指定で表示できない');

	//#endregion
	//#region 一覧(antennas/list)

	test('をリスト形式で取得できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: bob });
		const response = await successfulApiCall({
			endpoint: 'antennas/list',
			parameters: {},
			user: alice,
		});
		const expected = [{ ...antenna }];
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region 削除(antennas/delete)

	test('を削除できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/delete',
			parameters: { antennaId: antenna.id },
			user: alice,
		});
		assert.deepStrictEqual(response, null);
		const list = await successfulApiCall({ endpoint: 'antennas/list', parameters: {}, user: alice });
		assert.deepStrictEqual(list, []);
	});
	test.todo('は他人のものを削除できない');

	//#endregion

	describe('のノート', () => {
		//#region アンテナのノート取得(antennas/notes)

		test('を取得できること。', async () => {
			const keyword = 'キーワード';
			await post(bob, { text: `test ${keyword} beforehand` });
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]] },
				user: alice,
			});
			const note = await post(bob, { text: `test ${keyword}` });
			const response = await successfulApiCall({
				endpoint: 'antennas/notes',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			const expected = [note];
			assert.deepStrictEqual(response, expected);
		});

		const keyword = 'キーワード';
		test.each([
			{
				label: '全体から',
				parameters: (): object => ({ src: 'all' }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				// BUG e4144a1 以降home指定は壊れている(allと同じ)
				label: 'ホーム指定はallと同じ',
				parameters: (): object => ({ src: 'home' }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				// https://github.com/misskey-dev/misskey/issues/9025
				label: 'ただし、フォロワー限定投稿とDM投稿を含まない。フォロワーであっても。',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'public' }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'home' }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'followers' }) },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'specified', visibleUserIds: [alice.id] }) },
				],
			},
			{
				label: 'ブロックしているユーザーのノートは含む',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userBlockedByAlice, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'ブロックされているユーザーのノートは含まない',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userBlockingAlice, { text: `${keyword}` }) },
				],
			},
			{
				label: 'ミュートしているユーザーのノートは含まない',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userMutedByAlice, { text: `${keyword}` }) },
				],
			},
			{
				label: 'ミュートされているユーザーのノートは含む',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userMutingAlice, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '「見つけやすくする」がOFFのユーザーのノートも含まれる',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userNotExplorable, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '鍵付きユーザーのノートも含まれる',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userLocking, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'サイレンスのノートも含まれる',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userSilenced, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '削除ユーザーのノートも含まれる',
				parameters: (): object => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userDeletedBySelf, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userDeletedByAdmin, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'ユーザー指定で',
				parameters: (): object => ({ src: 'users', users: [`@${bob.username}`, `@${carol.username}`] }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `test ${keyword}` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				label: 'リスト指定で',
				parameters: (): object => ({ src: 'list', userListId: aliceList.id }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `test ${keyword}` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				label: 'CWにもマッチする',
				parameters: (): object => ({ keywords: [[keyword]] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test', cw: `cw ${keyword}` }), included: true },
				],
			},
			{
				label: 'キーワード1つ',
				parameters: (): object => ({ keywords: [[keyword]] }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: 'test' }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: 'test' }) },
				],
			},
			{
				label: 'キーワード3つ(AND)',
				parameters: (): object => ({ keywords: [['A', 'B', 'C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test A' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B C' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C B A A B C' }), included: true },
				],
			},
			{
				label: 'キーワード3つ(OR)',
				parameters: (): object => ({ keywords: [['A'], ['B'], ['C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C A' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C B' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C' }), included: true },
				],
			},
			{
				label: '除外ワード3つ(AND)',
				parameters: (): object => ({ excludeKeywords: [['A', 'B', 'C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A B` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C B` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C` }), included: true },
				],
			},
			{
				label: '除外ワード3つ(OR)',
				parameters: (): object => ({ excludeKeywords: [['A'], ['B'], ['C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A B` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C B` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C` }) },
				],
			},
			{
				label: 'キーワード1つ(大文字小文字区別する)',
				parameters: (): object => ({ keywords: [['KEYWORD']], caseSensitive: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'keyword' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'kEyWoRd' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'KEYWORD' }), included: true },
				],
			},
			{
				label: 'キーワード1つ(大文字小文字区別しない)',
				parameters: (): object => ({ keywords: [['KEYWORD']], caseSensitive: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'keyword' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'kEyWoRd' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'KEYWORD' }), included: true },
				],
			},
			{
				label: '除外ワード1つ(大文字小文字区別する)',
				parameters: (): object => ({ excludeKeywords: [['KEYWORD']], caseSensitive: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} keyword` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} kEyWoRd` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} KEYWORD` }) },
				],
			},
			{
				label: '除外ワード1つ(大文字小文字区別しない)',
				parameters: (): object => ({ excludeKeywords: [['KEYWORD']], caseSensitive: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} keyword` }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} kEyWoRd` }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} KEYWORD` }) },
				],
			},
			{
				label: '添付ファイルを問わない',
				parameters: (): object => ({ withFile: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, fileIds: [bobFile.id] }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '添付ファイル付きのみ',
				parameters: (): object => ({ withFile: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, fileIds: [bobFile.id] }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }) },
				],
			},
			{
				label: 'リプライ以外',
				parameters: (): object => ({ withReplies: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, replyId: alicePost.id }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'リプライも含む',
				parameters: (): object => ({ withReplies: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, replyId: alicePost.id }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
		])('が取得できること（$label）', async ({ parameters, posts }) => {
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]], ...parameters() },
				user: alice,
			});

			const notes = await posts.reduce(async (prev, current) => {
				// includedに関わらずnote()は評価して投稿する。
				const p = await prev;
				const n = await current.note();
				if (current.included) return p.concat(n);
				return p;
			}, Promise.resolve([] as Note[]));

			// alice視点でNoteを取り直す
			const expected = await Promise.all(notes.reverse().map(s => successfulApiCall({
				endpoint: 'notes/show',
				parameters: { noteId: s.id },
				user: alice,
			})));

			const response = await successfulApiCall({
				endpoint: 'antennas/notes',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			assert.deepStrictEqual(
				response.map(({ userId, id, text }) => ({ userId, id, text })),
				expected.map(({ userId, id, text }) => ({ userId, id, text })));
			assert.deepStrictEqual(response, expected);
		});

		test.skip('が取得でき、日付指定のPaginationに一貫性があること', async () => { });
		test.each([
			{ label: 'ID指定', offsetBy: 'id' },

			// BUG sinceDate, untilDateはsinceIdや他のエンドポイントとは異なり、その時刻に一致するレコードを含んでしまう。
			// { label: '日付指定', offsetBy: 'createdAt' },
		] as const)('が取得でき、$labelのPaginationに一貫性があること', async ({ offsetBy }) => {
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]] },
				user: alice,
			});
			const notes = await [...Array(30)].reduce(async (prev, current, index) => {
				const p = await prev;
				const n = await post(alice, { text: `${keyword} (${index})` });
				return [n].concat(p);
			}, Promise.resolve([] as Note[]));

			// antennas/notesは降順のみで、昇順をサポートしない。
			await testPaginationConsistency(notes, async (paginationParam) => {
				return successfulApiCall({
					endpoint: 'antennas/notes',
					parameters: { antennaId: antenna.id, ...paginationParam },
					user: alice,
				}) as any as Note[];
			}, offsetBy, 'desc');
		});

		// BUG 7日過ぎると作り直すしかない。 https://github.com/misskey-dev/misskey/issues/10476
		test.todo('を取得したときActiveに戻る');

		//#endregion
	});
});
