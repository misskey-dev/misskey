process.env.NODE_ENV = 'test';

import * as assert from 'assert';
// node-fetch only supports it's own Blob yet
// https://github.com/node-fetch/node-fetch/pull/1664
import { inspect } from 'node:util';
import * as crypto from 'node:crypto';
import * as cbor from 'cbor';
import * as OTPAuth from 'otpauth';
import { Blob } from 'node-fetch';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import { User } from '@/models/index.js';
import { Note } from '@/models/entities/Note.js';
import { Following } from '@/models/entities/Following.js';
import type { Packed } from '@/misc/json-schema.js';
import { loadConfig } from '../../src/config.js';
import {
	antenna,
	signup,
	clip,
	post,
	page,
	role,
	react,
	startServer,
	api,
	apiOk,
	apiError,
	uploadFile,
	userList,
	simpleGet,
	uploadUrl,
	hiddenNote,
	waitFire,
	connectStream,
	testPaginationConsistency,
	initTestDb,
} from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

/* 【エンドポイントテストの手引き】
 * 
 * このテストファイルの目的は下記の3点。
 * - Backend APIを一通り実行し、基本的な動作を検証する。壊れてしまった機能をマージ前に早期発見する。
 * - 機能の挙動、修正した不具合が再現しないことをテストコード化して人間によるテストの工数を削減する
 * - サードパーティークライアントの動作を破壊してしまう変更を検出する。
 *   - 例：名前の変更、必須パラメタの追加、レスポンス構造の改変、...
 * 
 * 各コントリビューターが自由にテストを追加してしまうと、テストの粒度にムラが発生し
 * 重複・抜けが出来てしまう恐れがあるため、テストは基本的に下記のルールで作成する：
 * 1. エンドポイントごとに、そのエンドポイントの「レスポンス」と「及ぼす作用」に注目してテストケースを作成する
 * 2. 原則複数のエンドポイントを1つのテスト関数でテストしない（事前条件を整えるために呼ぶのはOK）
 *   - 言い換えると「エンドポイント自体の作用」と「その結果別のエンドポイントが受ける影響」を別々のテストにする、ということ。
 * 3. テスト対象の各エンドポイントは「レスポンス」と「どのエンティティを書き換えるか」、でカテゴリ分けする 
 *   - 各エンドポイントは必ず1つのカテゴリに属することになる。2カテゴリに同じエンドポイントは入らない(streaming除く)
 *   - streamingはチャンネルがどのエンティティを扱うかでカテゴリ分けする
 * 
 * 例：
 * 「ブロック機能が動作すること」のテストを追加する場合、下記のように分割する
 *  - ブロック > 'blocking/create' に「ブロックができること」
 *  - ブロック > 'blocking/list' に「ブロックユーザーのリストに追加されること」
 *  - フォロー > 'following/create' に「ブロックユーザーをフォローできないこと」
 *  - ノート > 'notes/create' に「ブロックユーザーにリプライできないこと」
 *  - ノート > 'notes/local-timeline' に「ブロックユーザーのノートが表示されないこと」
 *  - ユーザー > 'users' に「ブロックユーザーが結果に載らないこと」
 *  - （※ほかにもたくさんテストケースがあるが省略）
 */

describe('API Endpoints', () => {
	//#region Entityの型定義

	type Note = misskey.entities.Note;

	// BUG misskey-jsとjson-schemaと実際に返ってくるデータが全部違う
	type User = misskey.entities.MeDetailed & { token: string };

	// BUG misskey-jsとjson-schemaが一致していない。
	// - srcのenumにgroupが残っている
	// - userGroupIdが残っている, isActiveがない
	type Antenna = misskey.entities.Antenna | Packed<'Antenna'>;
	type Clip = misskey.entities.Clip | Packed<'Clip'>;

	//#endregion
	//#region 共通で使えるユーザー、ノートなどの定義

	let app: INestApplicationContext;
	let root: User;
	let alice: User;
	let alicePost: misskey.entities.Note;
	let aliceNote: misskey.entities.Note;
	let aliceHomeNote: misskey.entities.Note;
	let aliceFollowersNote: misskey.entities.Note;
	let aliceSpecifiedNote: misskey.entities.Note;
	let alicePage: misskey.entities.Page;
	let aliceList: misskey.entities.UserList;
	let bob: any;
	let bobNote: misskey.entities.Note;
	let bobHomeNote: misskey.entities.Note;
	let bobFollowersNote: misskey.entities.Note;
	let bobSpecifiedNote: misskey.entities.Note;
	let bobFile: misskey.entities.DriveFile;
	let bobList: misskey.entities.UserList;
	let carol: any;
	let dave: User;
	let ellen: User;
	let frank: User;

	let usersReplying: User[];

	let userNoNote: User;
	let userNotExplorable: User;
	let userLocking: User;
	let userAdmin: User;
	let roleAdmin: any;
	let userModerator: User;
	let roleModerator: any;
	let userRolePublic: User;
	let rolePublic: any;
	let userRoleBadge: User;
	let roleBadge: any;
	let userSilenced: User;
	let roleSilenced: any;
	let userSuspended: User;
	let userDeletedBySelf: User;
	let userDeletedByAdmin: User;
	let userFollowingAlice: User;
	let userFollowedByAlice: User;
	let userBlockingAlice: User;
	let userBlockedByAlice: User;
	let userMutingAlice: User;
	let userMutedByAlice: User;
	let userRnMutingAlice: User;
	let userRnMutedByAlice: User;
	let userFollowRequesting: User;
	let userFollowRequested: User;

	//#endregion
	//#region beforeAll, afterAll, beforeEach, afterEach

	beforeAll(async () => {
		app = await startServer();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeAll(async () => {
		root = await signup({ username: 'root' }); // DB初期化後1番目に作るユーザーは管理者同等の扱い。
		alice = await signup({ username: 'alice', password: 'test' });
		alicePost = await post(alice, { text: 'test' }) as any;
		aliceNote = await post(alice, { text: 'test' }) as any;
		aliceHomeNote = await post(alice, { text: 'home only', visibility: 'home' }) as any;
		aliceFollowersNote = await post(alice, { text: 'followers only', visibility: 'followers' }) as any;
		aliceSpecifiedNote = await post(alice, { text: 'specified only', visibility: 'specified' }) as any;
		alicePage = await page(alice);
		bob = await signup({ username: 'bob' });
		bobNote = await post(bob, { text: 'test' }) as any;
		bobHomeNote = await post(bob, { text: 'home only', visibility: 'home' }) as any;
		bobFollowersNote = await post(bob, { text: 'followers only', visibility: 'followers' }) as any;
		bobSpecifiedNote = await post(bob, { text: 'specified only', visibility: 'specified' }) as any;
		bobFile = (await uploadFile(bob)).body;
		bobList = await userList(bob);
		carol = await signup({ username: 'carol' });
		dave = await signup({ username: 'dave' });
		ellen = await signup({ username: 'ellen' });
		frank = await signup({ username: 'frank' });

		aliceList = await userList(alice, { name: 'aliceList' });
		await apiOk({ endpoint: 'users/lists/push', parameters: { listId: aliceList.id, userId: bob.id }, user: alice });
		await apiOk({ endpoint: 'users/lists/push', parameters: { listId: aliceList.id, userId: carol.id }, user: alice });

		// @alice -> @replyingへのリプライ。Promise.allで一気に作るとtimeoutしてしまうのでreduceで一つ一つawaitする
		usersReplying = await [...Array(10)].map((_, i) => i).reduce(async (acc, i) => {
			const u = await signup({ username: `replying${i}` });
			for (let j = 0; j < 10 - i; j++) {
				const p = await post(u, { text: `test${j}` });
				await post(alice, { text: `@${u.username} test${j}`, replyId: p.id });
			}

			return (await acc).concat(u);
		}, Promise.resolve([] as User[]));

		userNoNote = await signup({ username: 'userNoNote' });
		userNotExplorable = await signup({ username: 'userNotExplorable' });
		await post(userNotExplorable, { text: 'test' });
		await apiOk({ endpoint: 'i/update', parameters: { isExplorable: false }, user: userNotExplorable });
		userLocking = await signup({ username: 'userLocking' });
		await post(userLocking, { text: 'test' });
		await apiOk({ endpoint: 'i/update', parameters: { isLocked: true }, user: userLocking });
		userAdmin = await signup({ username: 'userAdmin' });
		roleAdmin = await role(root, { isAdministrator: true, name: 'Admin Role' });
		await apiOk({ endpoint: 'admin/roles/assign', parameters: { userId: userAdmin.id, roleId: roleAdmin.id }, user: root });
		userModerator = await signup({ username: 'userModerator' });
		roleModerator = await role(root, { isModerator: true, name: 'Moderator Role' });
		await apiOk({ endpoint: 'admin/roles/assign', parameters: { userId: userModerator.id, roleId: roleModerator.id }, user: root });
		userRolePublic = await signup({ username: 'userRolePublic' });
		rolePublic = await role(root, { isPublic: true, name: 'Public Role' });
		await apiOk({ endpoint: 'admin/roles/assign', parameters: { userId: userRolePublic.id, roleId: rolePublic.id }, user: root });
		userRoleBadge = await signup({ username: 'userRoleBadge' });
		roleBadge = await role(root, { asBadge: true, name: 'Badge Role' });
		await apiOk({ endpoint: 'admin/roles/assign', parameters: { userId: userRoleBadge.id, roleId: roleBadge.id }, user: root });
		userSilenced = await signup({ username: 'userSilenced' });
		await post(userSilenced, { text: 'test' });
		roleSilenced = await role(root, {}, { canPublicNote: { priority: 0, useDefault: false, value: false } });
		await apiOk({ endpoint: 'admin/roles/assign', parameters: { userId: userSilenced.id, roleId: roleSilenced.id }, user: root });
		userSuspended = await signup({ username: 'userSuspended' });
		await post(userSuspended, { text: 'test' });
		await apiOk({ endpoint: 'i/update', parameters: { description: '#user_testuserSuspended' }, user: userSuspended });
		await apiOk({ endpoint: 'admin/suspend-user', parameters: { userId: userSuspended.id }, user: root });
		userDeletedBySelf = await signup({ username: 'userDeletedBySelf', password: 'userDeletedBySelf' });
		await post(userDeletedBySelf, { text: 'test' });
		await apiOk({ endpoint: 'i/delete-account', parameters: { password: 'userDeletedBySelf' }, user: userDeletedBySelf });
		userDeletedByAdmin = await signup({ username: 'userDeletedByAdmin' });
		await post(userDeletedByAdmin, { text: 'test' });
		await apiOk({ endpoint: 'admin/delete-account', parameters: { userId: userDeletedByAdmin.id }, user: root });
		userFollowingAlice = await signup({ username: 'userFollowingAlice' });
		await post(userFollowingAlice, { text: 'test' });
		await apiOk({ endpoint: 'following/create', parameters: { userId: alice.id }, user: userFollowingAlice });
		userFollowedByAlice = await signup({ username: 'userFollowedByAlice' });
		await post(userFollowedByAlice, { text: 'test' });
		await apiOk({ endpoint: 'following/create', parameters: { userId: userFollowedByAlice.id }, user: alice });
		userBlockingAlice = await signup({ username: 'userBlockingAlice' });
		await post(userBlockingAlice, { text: 'test' });
		await apiOk({ endpoint: 'blocking/create', parameters: { userId: alice.id }, user: userBlockingAlice });
		userBlockedByAlice = await signup({ username: 'userBlockedByAlice' });
		await post(userBlockedByAlice, { text: 'test' });
		await apiOk({ endpoint: 'blocking/create', parameters: { userId: userBlockedByAlice.id }, user: alice });
		userMutingAlice = await signup({ username: 'userMutingAlice' });
		await post(userMutingAlice, { text: 'test' });
		await apiOk({ endpoint: 'mute/create', parameters: { userId: alice.id }, user: userMutingAlice });
		userMutedByAlice = await signup({ username: 'userMutedByAlice' });
		await post(userMutedByAlice, { text: 'test' });
		await apiOk({ endpoint: 'mute/create', parameters: { userId: userMutedByAlice.id }, user: alice });
		userRnMutingAlice = await signup({ username: 'userRnMutingAlice' });
		await post(userRnMutingAlice, { text: 'test' });
		await apiOk({ endpoint: 'renote-mute/create', parameters: { userId: alice.id }, user: userRnMutingAlice });
		userRnMutedByAlice = await signup({ username: 'userRnMutedByAlice' });
		await post(userRnMutedByAlice, { text: 'test' });
		await apiOk({ endpoint: 'renote-mute/create', parameters: { userId: userRnMutedByAlice.id }, user: alice });
		userFollowRequesting = await signup({ username: 'userFollowRequesting' });
		await post(userFollowRequesting, { text: 'test' });
		userFollowRequested = userLocking;
		await apiOk({ endpoint: 'following/create', parameters: { userId: userFollowRequested.id }, user: userFollowRequesting });
	}, 1000 * 60 * 10);

	beforeEach(async () => {
		alice = {
			...alice,
			...await apiOk({ endpoint: 'i', parameters: {}, user: alice }) as any,
		};
		aliceNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: aliceNote.id }, user: alice });
		aliceHomeNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: aliceHomeNote.id }, user: alice });
		aliceFollowersNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: aliceFollowersNote.id }, user: alice });
		aliceSpecifiedNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: aliceSpecifiedNote.id }, user: alice });
		bobNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: bobNote.id }, user: alice });
		bobHomeNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: bobHomeNote.id }, user: alice });
		bobFollowersNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: bobFollowersNote.id }, user: alice });
		bobSpecifiedNote = await apiOk({ endpoint: 'notes/show', parameters: { noteId: bobSpecifiedNote.id }, user: alice });
	});

	//#endregion
	//#region utilに切り出すほどでもない共通関数

	const compareBy = <T extends { id: string },>(selector: (s: T) => string = (s: T): string => s.id) => (a: T, b: T): number => {
		return selector(a).localeCompare(selector(b));
	};

	//#endregion

	describe('アンテナ', () => {
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
			const response = await apiOk({
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
			} as Antenna;
			assert.deepStrictEqual(response, expected);
		});

		test('が上限いっぱいまで作成できること', async () => {
			// antennaLimit + 1まで作れるのがキモ
			const response = await Promise.all([...Array(DEFAULT_POLICIES.antennaLimit + 1)].map(() => apiOk({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam },
				user: alice,
			})));

			const expected = await apiOk({ endpoint: 'antennas/list', parameters: {}, user: alice });
			assert.deepStrictEqual(
				response.sort(compareBy(s => s.id)),
				expected.sort(compareBy(s => s.id)));

			apiError({
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
			apiError({
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
			const response = await apiOk({
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
			const antenna = await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
			const response = await apiOk({
				endpoint: 'antennas/update',
				parameters: { antennaId: antenna.id, ...defaultParam, ...parameters() },
				user: alice,
			});
			const expected = { ...response, ...parameters() };
			assert.deepStrictEqual(response, expected);
		});
		test.todo('は他人のものは変更できない');

		test('を変更するとき他人のリストを指定したらエラーになる', async () => {
			const antenna = await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
			apiError({
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
			const antenna = await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
			const response = await apiOk({
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
			const antenna = await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
			await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: bob });
			const response = await apiOk({
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
			const antenna = await apiOk({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
			const response = await apiOk({
				endpoint: 'antennas/delete',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			assert.deepStrictEqual(response, null);
			const list = await apiOk({ endpoint: 'antennas/list', parameters: {}, user: alice });
			assert.deepStrictEqual(list, []);
		});
		test.todo('は他人のものを削除できない');

		//#endregion
	});

	describe('ブロック', () => {
		afterAll(async () => {
			await api('/blocking/delete', {
				userId: bob.id,
			}, alice);
		});

		test('Block作成', async () => {
			const res = await api('/blocking/create', {
				userId: bob.id,
			}, alice);

			assert.strictEqual(res.status, 200);
		});
	});

	describe('チャンネル', () => {
		//#region 検索(channels/search)
		test('空白検索で一覧を取得できる', async () => {
			await api('/channels/create', {
				name: 'aaa',
				description: 'bbb',
			}, bob);
			await api('/channels/create', {
				name: 'ccc1',
				description: 'ddd1',
			}, bob);
			await api('/channels/create', {
				name: 'ccc2',
				description: 'ddd2',
			}, bob);

			const res = await api('/channels/search', {
				query: '',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 3);
		});
		test('名前のみの検索で名前を検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'aaa',
				type: 'nameOnly',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 1);
			assert.strictEqual(res.body[0].name, 'aaa');
		});
		test('名前のみの検索で名前を複数検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'ccc',
				type: 'nameOnly',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 2);
		});
		test('名前のみの検索で説明は検索できない', async () => {
			const res = await api('/channels/search', {
				query: 'bbb',
				type: 'nameOnly',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 0);
		});
		test('名前と説明の検索で名前を検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'ccc1',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 1);
			assert.strictEqual(res.body[0].name, 'ccc1');
		});
		test('名前と説明での検索で説明を検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'ddd1',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 1);
			assert.strictEqual(res.body[0].name, 'ccc1');
		});
		test('名前と説明の検索で名前を複数検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'ccc',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 2);
		});
		test('名前と説明での検索で説明を複数検索できる', async () => {
			const res = await api('/channels/search', {
				query: 'ddd',
			}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 2);
		});
		//#endregion
	});

	describe('クリップ', () => {
		// クリップを作成できる最小のパラメタ
		const defaultParam = {
			name: 'test',
		};

		const createMany = async (parameters: Partial<CreateParam>, count = 10, user = alice): Promise<Clip[]> => {
			return await Promise.all([...Array(count)].map((_, i) => apiOk<Clip>({
				endpoint: '/clips/create',
				parameters: {
					...defaultParam,
					name: `test${i}`,
					...parameters,
				},
				user,
			})));
		};

		afterEach(async () => {
			// テスト間で影響し合わないように毎回全部消す。
			for (const user of [alice, bob]) {
				const list = await api('/clips/list', { limit: 11 }, user);
				for (const clip of list.body) {
					await api('/clips/delete', { clipId: clip.id }, user);
				}
			}
		});

		//#region クリップの作成(clips/create)

		test('の作成ができる', async () => {
			const response = await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam },
				user: alice,
			});
			const expected = {
				id: response.id,
				createdAt: new Date(response.createdAt).toISOString(), // ISO 8601で日付が返ってくること
				lastClippedAt: null,
				name: 'test',
				description: null,
				isPublic: false,
				favoritedCount: 0,
				isFavorited: false,
				user: aliceNote.user,
				userId: alice.id,
			};
			assert.deepStrictEqual(response, expected);
		});

		test('の作成はポリシーで定められた数以上はできない。', async () => {
			// ポリシー + 1まで作れるという所がミソ
			const clipLimit = DEFAULT_POLICIES.clipLimit + 1;
			for (let i = 0; i < clipLimit; i++) {
				await apiOk({ endpoint: 'clips/create', parameters: defaultParam, user: alice });
			}

			await apiError({
				endpoint: 'clips/create',
				parameters: defaultParam,
				user: alice,
			}, {
				status: 400,
				code: 'TOO_MANY_CLIPS',
				id: '920f7c2d-6208-4b76-8082-e632020f5883',
			});
		});

		const createClipAllowedPattern = [
			{ label: 'nameが最大長', parameters: { name: 'x'.repeat(100) } },
			{ label: 'private', parameters: { isPublic: false } },
			{ label: 'public', parameters: { isPublic: true } },
			{ label: 'descriptionがnull', parameters: { description: null } },
			{ label: 'descriptionが最大長', parameters: { description: 'a'.repeat(2048) } },
		];
		test.each(createClipAllowedPattern)('の作成は$labelでもできる', async ({ parameters }) => {
			await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam, ...parameters },
				user: alice,
			});
		});

		const createClipDenyPattern = [
			{ label: 'nameがnull', parameters: { name: null } },
			{ label: 'nameが最大長+1', parameters: { name: 'x'.repeat(101) } },
			{ label: 'isPublicがboolじゃない', parameters: { isPublic: 'true' } },
			{ label: 'descriptionがゼロ長', parameters: { description: '' } },
			{ label: 'descriptionが最大長+1', parameters: { description: 'a'.repeat(2049) } },
		];
		test.each(createClipDenyPattern)('の作成は$labelならできない', async ({ parameters }) => apiError({
			endpoint: 'clips/create',
			parameters: { ...defaultParam, ...parameters },
			user: alice,
		}, {
			status: 400,
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		}));

		//#endregion
		//#region クリップの更新(clips/update)

		test('の更新ができる', async () => {
			const res = await apiOk({
				endpoint: 'clips/update',
				parameters: {
					clipId: (await apiOk({
						endpoint: 'clips/create',
						parameters: { ...defaultParam },
						user: alice,
					})).id,
					name: 'updated',
					description: 'new description',
					isPublic: true,
				},
				user: alice,
			});

			// ISO 8601で日付が返ってくること
			assert.strictEqual(res.createdAt, new Date(res.createdAt).toISOString());
			assert.strictEqual(res.lastClippedAt, null);
			assert.strictEqual(res.name, 'updated');
			assert.strictEqual(res.description, 'new description');
			assert.strictEqual(res.isPublic, true);
			assert.strictEqual(res.favoritedCount, 0);
			assert.strictEqual(res.isFavorited, false);
		});

		test.each(createClipAllowedPattern)('の更新は$labelでもできる', async ({ parameters }) =>
			await apiOk({
				endpoint: 'clips/update',
				parameters: {
					clipId: (await apiOk({
						endpoint: 'clips/create',
						parameters: { ...defaultParam },
						user: alice,
					})).id,
					name: 'updated',
					...parameters,
				},
				user: alice,
			}));

		test.each([
			{ label: 'clipIdがnull', parameters: { clipId: null } },
			{
				label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assertion: {
					code: 'NO_SUCH_CLIP',
					id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
				},
			},
			{
				label: '他人のクリップ', user: (): User => bob, assertion: {
					code: 'NO_SUCH_CLIP',
					id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
				},
			},
			...createClipDenyPattern as any,
		])('の更新は$labelならできない', async ({ parameters, user, assertion }) => apiError({
			endpoint: 'clips/update',
			parameters: {
				clipId: (await apiOk({
					endpoint: 'clips/create',
					parameters: { ...defaultParam },
					user: (user ?? ((): User => alice))(),
				})).id,
				name: 'updated',
				...parameters,
			},
			user: alice,
		}, {
			status: 400,
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			...assertion,
		}));

		//#endregion
		//#region クリップの削除(clips/delete)

		test('の削除ができる', async () => {
			await apiOk({
				endpoint: '/clips/delete',
				parameters: {
					clipId: (await apiOk({
						endpoint: 'clips/create',
						parameters: { ...defaultParam },
						user: alice,
					})).id,
				},
				user: alice,
			});
			assert.deepStrictEqual(await apiOk({
				endpoint: 'clips/list',
				parameters: {},
				user: alice,
			}), []);
		});

		test.each([
			{ label: 'clipIdがnull', parameters: { clipId: null } },
			{
				label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assertion: {
					code: 'NO_SUCH_CLIP',
					id: '70ca08ba-6865-4630-b6fb-8494759aa754',
				},
			},
			{
				label: '他人のクリップ', user: (): User => bob, assertion: {
					code: 'NO_SUCH_CLIP',
					id: '70ca08ba-6865-4630-b6fb-8494759aa754',
				},
			},
		])('の削除は$labelならできない', async ({ parameters, user, assertion }) => apiError({
			endpoint: '/clips/delete',
			parameters: {
				clipId: (await apiOk({
					endpoint: '/clips/create',
					parameters: {
						...defaultParam,
						...parameters,
					},
					user: (user ?? ((): User => alice))(),
				})).id,
				...parameters,
			},
			user: alice,
		}, {
			status: 400,
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			...assertion,
		}));

		//#endregion
		//#region クリップのID指定取得(clips/show)

		test('のID指定取得ができる', async () => {
			const clip = await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam },
				user: alice,
			});
			const res = await apiOk({
				endpoint: '/clips/show',
				parameters: { clipId: clip.id },
				user: alice,
			});
			assert.deepStrictEqual(res, clip);
		});

		test('のID指定取得は他人のPrivateなクリップは取得できない', async () => {
			const clip = await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam, isPublic: false },
				user: bob,
			});
			apiError({
				endpoint: '/clips/show',
				parameters: { clipId: clip.id },
				user: alice,
			}, {
				status: 400,
				code: 'NO_SUCH_CLIP',
				id: 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20',
			});
		});

		test.each([
			{ label: 'clipId未指定', parameters: { clipId: undefined } },
			{
				label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assetion: {
					code: 'NO_SUCH_CLIP',
					id: 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20',
				},
			},
		])('のID指定取得は$labelならできない', async ({ parameters, assetion }) => apiError({
			endpoint: '/clips/show',
			parameters: {
				...parameters,
			},
			user: alice,
		}, {
			status: 400,
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			...assetion,
		}));

		//#endregion
		//#region 自分のクリップの一覧(clips/list)

		test('の一覧(clips/list)が取得できる(空)', async () => {
			const res = await apiOk({
				endpoint: 'clips/list',
				parameters: {},
				user: alice,
			});
			assert.deepStrictEqual(res, []);
		});

		test('の一覧(clips/list)が取得できる(上限いっぱい)', async () => {
			const clipLimit = DEFAULT_POLICIES.clipLimit + 1;
			const clips = await createMany({}, clipLimit);
			const res = await apiOk({
				endpoint: 'clips/list',
				parameters: { limit: 1 }, // FIXME: 無視されて11全部返ってくる
				user: alice,
			});

			// 返ってくる配列には順序保障がないのでidでソートして厳密比較
			assert.deepStrictEqual(
				res.sort(compareBy(s => s.id)),
				clips.sort(compareBy(s => s.id)),
			);
		});

		//#endregion
		//#region クリップの一覧(users/clips)

		test('の一覧が取得できる(空)', async () => {
			const res = await apiOk({
				endpoint: 'users/clips',
				parameters: { userId: alice.id },
				user: alice,
			});
			assert.deepStrictEqual(res, []);
		});

		test.each([
			{ label: '' },
			{ label: '他人アカウントから', user: (): User => bob },
		])('の一覧が$label取得できる', async () => {
			const clips = await createMany({ isPublic: true });
			const res = await apiOk({
				endpoint: 'users/clips',
				parameters: { userId: alice.id },
				user: alice,
			});

			// 返ってくる配列には順序保障がないのでidでソートして厳密比較
			assert.deepStrictEqual(
				res.sort(compareBy(s => s.id)),
				clips.sort(compareBy(s => s.id)));

			// 認証状態で見たときだけisFavoritedが入っている
			for (const clip of res) {
				assert.strictEqual(clip.isFavorited, false);
			}
		});

		test.each([
			{ label: '未認証', user: (): undefined => undefined },
			{ label: '存在しないユーザーのもの', parameters: { userId: 'xxxxxxx' } },
		])('の一覧は$labelでも取得できる', async ({ parameters, user }) => {
			const clips = await createMany({ isPublic: true });
			const res = await apiOk({
				endpoint: 'users/clips',
				parameters: {
					userId: alice.id,
					limit: clips.length,
					...parameters,
				},
				user: (user ?? ((): User => alice))(),
			});

			// 未認証で見たときはisFavoritedは入らない
			for (const clip of res) {
				assert.strictEqual('isFavorited' in clip, false);
			}
		});

		test('の一覧はPrivateなクリップを含まない(自分のものであっても。)', async () => {
			await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam, isPublic: false },
				user: alice,
			});
			const aliceClip = await await apiOk({
				endpoint: 'clips/create',
				parameters: { ...defaultParam, isPublic: true },
				user: alice,
			});
			const res = await apiOk({
				endpoint: 'users/clips',
				parameters: {
					userId: alice.id,
					limit: 2,
				},
				user: alice,
			});
			assert.deepStrictEqual(res, [aliceClip]);
		});

		test('の一覧はID指定で範囲選択ができる', async () => {
			const clips = await createMany({ isPublic: true }, 7);
			clips.sort(compareBy(s => s.id));
			const res = await apiOk({
				endpoint: 'users/clips',
				parameters: {
					userId: alice.id,
					sinceId: clips[1].id,
					untilId: clips[5].id,
					limit: 4,
				},
				user: alice,
			});

			// Promise.allで返ってくる配列には順序保障がないのでidでソートして厳密比較
			assert.deepStrictEqual(
				res.sort(compareBy(s => s.id)),
				[clips[2], clips[3], clips[4]], // sinceIdとuntilId自体は結果に含まれない
				clips[1].id + ' ... ' + clips[3].id + ' with ' + clips.map(s => s.id) + ' vs. ' + res.map(s => s.id));
		});

		test.each([
			{ label: 'userId未指定', parameters: { userId: undefined } },
			{ label: 'limitゼロ', parameters: { limit: 0 } },
			{ label: 'limit最大+1', parameters: { limit: 101 } },
		])('の一覧は$labelだと取得できない', async ({ parameters }) => apiError({
			endpoint: '/users/clips',
			parameters: {
				userId: alice.id,
				...parameters,
			},
			user: alice,
		}, {
			status: 400,
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		}));

		//#endregion

		test.each([
			{ label: '作成', endpoint: '/clips/create' },
			{ label: '更新', endpoint: '/clips/update' },
			{ label: '削除', endpoint: '/clips/delete' },
			{ label: '取得', endpoint: '/clips/list' },
			{ label: 'お気に入り設定', endpoint: '/clips/favorite' },
			{ label: 'お気に入り解除', endpoint: '/clips/unfavorite' },
			{ label: 'お気に入り取得', endpoint: '/clips/my-favorites' },
			{ label: 'ノート追加', endpoint: '/clips/add-note' },
			{ label: 'ノート削除', endpoint: '/clips/remove-note' },
		])('の$labelは未認証ではできない', async ({ endpoint }) => await apiError({
			endpoint: endpoint,
			parameters: {},
			user: undefined,
		}, {
			status: 401,
			code: 'CREDENTIAL_REQUIRED',
			id: '1384574d-a912-4b81-8601-c7b1c4085df1',
		}));

		describe('のお気に入り', () => {
			let aliceClip: Clip;

			beforeEach(async () => {
				aliceClip = await apiOk({
					endpoint: 'clips/create',
					parameters: { ...defaultParam },
					user: alice,
				});
			});

			afterEach(async () => {
				await apiOk({
					endpoint: 'clips/delete',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
			});

			//#region クリップのお気に入り(clips/favorite)

			test('を設定できる。', async () => {
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				const clip = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				assert.strictEqual(clip.favoritedCount, 1);
				assert.strictEqual(clip.isFavorited, true);
			});

			test('はPublicな他人のクリップに設定できる。', async () => {
				const publicClip = await apiOk({
					endpoint: 'clips/create',
					parameters: { ...defaultParam, isPublic: true },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: publicClip.id },
					user: bob,
				});
				const clip = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: publicClip.id },
					user: bob,
				});
				assert.strictEqual(clip.favoritedCount, 1);
				assert.strictEqual(clip.isFavorited, true);

				// isFavoritedは見る人によって切り替わる。
				const clip2 = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: publicClip.id },
					user: alice,
				});
				assert.strictEqual(clip2.favoritedCount, 1);
				assert.strictEqual(clip2.isFavorited, false);
			});

			test('は1つのクリップに対して複数人が設定できる。', async () => {
				const publicClip = await apiOk({
					endpoint: 'clips/create',
					parameters: { ...defaultParam, isPublic: true },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: publicClip.id },
					user: bob,
				});
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: publicClip.id },
					user: alice,
				});
				const clip = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: publicClip.id },
					user: bob,
				});
				assert.strictEqual(clip.favoritedCount, 2);
				assert.strictEqual(clip.isFavorited, true);

				const clip2 = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: publicClip.id },
					user: alice,
				});
				assert.strictEqual(clip2.favoritedCount, 2);
				assert.strictEqual(clip2.isFavorited, true);
			});

			test('は11を超えて設定できる。', async () => {
				const clips = [
					aliceClip,
					...await createMany({}, 10, alice),
					...await createMany({ isPublic: true }, 10, bob),
				];
				for (const clip of clips) {
					await apiOk({
						endpoint: 'clips/favorite',
						parameters: { clipId: clip.id },
						user: alice,
					});
				}

				// pagenationはない。全部一気にとれる。
				const favorited = await apiOk({
					endpoint: 'clips/my-favorites',
					parameters: {},
					user: alice,
				});
				assert.strictEqual(favorited.length, clips.length);
				for (const clip of favorited) {
					assert.strictEqual(clip.favoritedCount, 1);
					assert.strictEqual(clip.isFavorited, true);
				}
			});

			test('は同じクリップに対して二回設定できない。', async () => {
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				await apiError({
					endpoint: '/clips/favorite',
					parameters: {
						clipId: aliceClip.id,
					},
					user: alice,
				}, {
					status: 400,
					code: 'ALREADY_FAVORITED',
					id: '92658936-c625-4273-8326-2d790129256e',
				});
			});

			test.each([
				{ label: 'clipIdがnull', parameters: { clipId: null } },
				{
					label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '4c2aaeae-80d8-4250-9606-26cb1fdb77a5',
					},
				},
				{
					label: '他人のクリップ', user: (): User => bob, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '4c2aaeae-80d8-4250-9606-26cb1fdb77a5',
					},
				},
			])('の設定は$labelならできない', async ({ parameters, user, assertion }) => apiError({
				endpoint: '/clips/favorite',
				parameters: {
					clipId: (await apiOk({
						endpoint: 'clips/create',
						parameters: { ...defaultParam },
						user: (user ?? ((): User => alice))(),
					})).id,
					...parameters,
				},
				user: alice,
			}, {
				status: 400,
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				...assertion,
			}));

			//#endregion
			//#region クリップのお気に入り解除(clips/unfavorite)

			test('を設定解除できる。', async () => {
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/unfavorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				const clip = await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				assert.strictEqual(clip.favoritedCount, 0);
				assert.strictEqual(clip.isFavorited, false);
				assert.deepStrictEqual(await apiOk({
					endpoint: 'clips/my-favorites',
					parameters: {},
					user: alice,
				}), []);
			});

			test.each([
				{ label: 'clipIdがnull', parameters: { clipId: null } },
				{
					label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '2603966e-b865-426c-94a7-af4a01241dc1',
					},
				},
				{
					label: '他人のクリップ', user: (): User => bob, assertion: {
						code: 'NOT_FAVORITED',
						id: '90c3a9e8-b321-4dae-bf57-2bf79bbcc187',
					},
				},
				{
					label: 'お気に入りしていないクリップ', assertion: {
						code: 'NOT_FAVORITED',
						id: '90c3a9e8-b321-4dae-bf57-2bf79bbcc187',
					},
				},
			])('の設定解除は$labelならできない', async ({ parameters, user, assertion }) => apiError({
				endpoint: '/clips/unfavorite',
				parameters: {
					clipId: (await apiOk({
						endpoint: 'clips/create',
						parameters: { ...defaultParam },
						user: (user ?? ((): User => alice))(),
					})).id,
					...parameters,
				},
				user: alice,
			}, {
				status: 400,
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				...assertion,
			}));

			//#endregion
			//#region お気に入りに追加したクリップの一覧(clips/favorite)

			test('を取得できる。', async () => {
				await apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				const favorited = await apiOk({
					endpoint: 'clips/my-favorites',
					parameters: {},
					user: alice,
				});
				assert.deepStrictEqual(favorited, [await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: aliceClip.id },
					user: alice,
				})]);
			});

			test('を取得したとき他人のお気に入りは含まない。', async () => {
				apiOk({
					endpoint: 'clips/favorite',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				const favorited = await apiOk({
					endpoint: 'clips/my-favorites',
					parameters: {},
					user: bob,
				});
				assert.deepStrictEqual(favorited, []);
			});

			//#endregion
		});
	});

	describe('フォロー', () => {
		afterEach(async () => {
			await api('/i/update', {
				ffVisibility: 'public',
			}, alice);
		});

		//#region フォローする(following/create)

		test('フォローできる', async () => {
			const res = await api('/following/create', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(res.status, 200);

			const connection = await initTestDb(true);
			const Users = connection.getRepository(User);
			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.followersCount, 0);
			assert.strictEqual(newBob.followingCount, 1);
			const newAlice = await Users.findOneByOrFail({ id: alice.id });
			assert.strictEqual(newAlice.followersCount, alice.followersCount + 1);
			assert.strictEqual(newAlice.followingCount, alice.followingCount);
			connection.destroy();
		});

		test('既にフォローしている場合は怒る', async () => {
			const res = await api('/following/create', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(res.status, 400);
		});

		test('存在しないユーザーはフォローできない', async () => {
			const res = await api('/following/create', {
				userId: '000000000000000000000000',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('自分自身はフォローできない', async () => {
			const res = await api('/following/create', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('空のパラメータで怒られる', async () => {
			const res = await api('/following/create', {}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('間違ったIDで怒られる', async () => {
			const res = await api('/following/create', {
				userId: 'foo',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('ブロックされているユーザーをフォローできない', async () => {
			const res = await api('/following/create', { userId: alice.id }, userBlockedByAlice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.id, 'c4ab57cc-4e41-45e9-bfd9-584f61e35ce0');
		});

		//#endregion
		//#region フォロー解除(following/delete)

		test('フォロー解除できる', async () => {
			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const res = await api('/following/delete', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(res.status, 200);

			const connection = await initTestDb(true);
			const Users = connection.getRepository(User);
			const newBob = await Users.findOneByOrFail({ id: bob.id });
			assert.strictEqual(newBob.followersCount, 0);
			assert.strictEqual(newBob.followingCount, 0);
			const newAlice = await Users.findOneByOrFail({ id: alice.id });
			assert.strictEqual(newAlice.followersCount, alice.followersCount - 1);
			assert.strictEqual(newAlice.followingCount, alice.followingCount);
			connection.destroy();
		});

		test('フォローしていないのに解除した場合は怒る', async () => {
			const res = await api('/following/delete', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(res.status, 400);
		});

		test('存在しないユーザーはフォロー解除できない', async () => {
			const res = await api('/following/delete', {
				userId: '000000000000000000000000',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('自分自身はフォロー解除できない', async () => {
			const res = await api('/following/delete', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('空のパラメータで解除した場合は怒られる', async () => {
			const res = await api('/following/delete', {}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('間違ったIDで解除した場合は怒られる', async () => {
			const res = await api('/following/delete', {
				userId: 'kyoppie',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		//#endregion
		//#region フォローリスト(users/following)

		test('ffVisibility が public なユーザーのフォローを誰でも見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'public',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		});

		test('ffVisibility が followers なユーザーのフォローを自分で見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		});

		test('ffVisibility が followers なユーザーのフォローを非フォロワーが見れない', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);
			await api('/following/delete', {
				userId: alice.id,
			}, bob);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followingRes.status, 400);
		});

		test('ffVisibility が followers なユーザーのフォローをフォロワーが見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);

			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		});

		test('ffVisibility が private なユーザーのフォローを自分で見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(followingRes.status, 200);
			assert.strictEqual(Array.isArray(followingRes.body), true);
		});

		test('ffVisibility が private なユーザーのフォローを他人が見れない', async () => {
			await api('/i/update', {
				ffVisibility: 'private',
			}, alice);

			const followingRes = await api('/users/following', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followingRes.status, 400);
		});

		//#endregion
		//#region フォロワーリスト(users/following)

		test('ffVisibility が public なユーザーのフォロワーを誰でも見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'public',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		});

		test('ffVisibility が followers なユーザーのフォロワーを自分で見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		});

		test('ffVisibility が followers なユーザーのフォロワーを非フォロワーが見れない', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);
			await api('/following/delete', {
				userId: alice.id,
			}, bob);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followersRes.status, 400);
		});

		test('ffVisibility が followers なユーザーのフォロワーをフォロワーが見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'followers',
			}, alice);

			await api('/following/create', {
				userId: alice.id,
			}, bob);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		});

		test('ffVisibility が private なユーザーのフォロワーを自分で見れる', async () => {
			await api('/i/update', {
				ffVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(followersRes.status, 200);
			assert.strictEqual(Array.isArray(followersRes.body), true);
		});

		test('ffVisibility が private なユーザーのフォロワーを他人が見れない', async () => {
			await api('/i/update', {
				ffVisibility: 'private',
			}, alice);

			const followersRes = await api('/users/followers', {
				userId: alice.id,
			}, bob);

			assert.strictEqual(followersRes.status, 400);
		});

		// TODO このテストはEndpoint自体のテストではないため本来このファイルにいるべきではない。
		describe('AP', () => {
			test('ffVisibility が public 以外ならばAPからは取得できない', async () => {
				{
					await api('/i/update', {
						ffVisibility: 'public',
					}, alice);

					const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
					const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
					assert.strictEqual(followingRes.status, 200);
					assert.strictEqual(followersRes.status, 200);
				}
				{
					await api('/i/update', {
						ffVisibility: 'followers',
					}, alice);

					const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
					const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
					assert.strictEqual(followingRes.status, 403);
					assert.strictEqual(followersRes.status, 403);
				}
				{
					await api('/i/update', {
						ffVisibility: 'private',
					}, alice);

					const followingRes = await simpleGet(`/users/${alice.id}/following`, 'application/activity+json');
					const followersRes = await simpleGet(`/users/${alice.id}/followers`, 'application/activity+json');
					assert.strictEqual(followingRes.status, 403);
					assert.strictEqual(followersRes.status, 403);
				}
			});
		});

		//#endregion
	});

	describe('ファイル(ドライブ)', () => {
		//#region ドライブの情報(drive)

		test('ドライブ情報を取得できる', async () => {
			await uploadFile(alice, {
				blob: new Blob([new Uint8Array(256)]),
			});
			await uploadFile(alice, {
				blob: new Blob([new Uint8Array(512)]),
			});
			await uploadFile(alice, {
				blob: new Blob([new Uint8Array(1024)]),
			});
			const res = await api('/drive', {}, alice);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			expect(res.body).toHaveProperty('usage', 1792);
		});

		//#endregion
		//#region ファイルの作成(drive/files/create)

		test('ファイルを作成できる', async () => {
			const res = await uploadFile(alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'Lenna.jpg');
		});

		test('ファイルに名前を付けられる', async () => {
			const res = await uploadFile(alice, { name: 'Belmond.jpg' });

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'Belmond.jpg');
		});

		test('ファイルに名前を付けられるが、拡張子は正しいものになる', async () => {
			const res = await uploadFile(alice, { name: 'Belmond.png' });

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'Belmond.png.jpg');
		});

		test('ファイル無しで怒られる', async () => {
			const res = await api('/drive/files/create', {}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('SVGファイルを作成できる', async () => {
			const res = await uploadFile(alice, { path: 'image.svg' });

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'image.svg');
			assert.strictEqual(res.body.type, 'image/svg+xml');
		});

		for (const type of ['webp', 'avif']) {
			const mediaType = `image/${type}`;

			const getWebpublicType = async (user: any, fileId: string): Promise<string> => {
				// drive/files/create does not expose webpublicType directly, so get it by posting it
				const res = await post(user, {
					text: mediaType,
					fileIds: [fileId],
				});
				const apRes = await simpleGet(`notes/${res.id}`, 'application/activity+json');
				assert.strictEqual(apRes.status, 200);
				assert.ok(Array.isArray(apRes.body.attachment));
				return apRes.body.attachment[0].mediaType;
			};

			test(`透明な${type}ファイルを作成できる`, async () => {
				const path = `with-alpha.${type}`;
				const res = await uploadFile(alice, { path });

				assert.strictEqual(res.status, 200);
				assert.strictEqual(res.body.name, path);
				assert.strictEqual(res.body.type, mediaType);

				const webpublicType = await getWebpublicType(alice, res.body.id);
				assert.strictEqual(webpublicType, 'image/webp');
			});

			test(`透明じゃない${type}ファイルを作成できる`, async () => {
				const path = `without-alpha.${type}`;
				const res = await uploadFile(alice, { path });
				assert.strictEqual(res.status, 200);
				assert.strictEqual(res.body.name, path);
				assert.strictEqual(res.body.type, mediaType);

				const webpublicType = await getWebpublicType(alice, res.body.id);
				assert.strictEqual(webpublicType, 'image/webp');
			});
		}

		//#endregion
		//#region ファイルの更新(drive/files/update)

		test('名前を更新できる', async () => {
			const file = (await uploadFile(alice)).body;
			const newName = 'いちごパスタ.png';

			const res = await api('/drive/files/update', {
				fileId: file.id,
				name: newName,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, newName);
		});

		test('他人のファイルは更新できない', async () => {
			const file = (await uploadFile(alice)).body;

			const res = await api('/drive/files/update', {
				fileId: file.id,
				name: 'いちごパスタ.png',
			}, bob);

			assert.strictEqual(res.status, 400);
		});

		test('親フォルダを更新できる', async () => {
			const file = (await uploadFile(alice)).body;
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			const res = await api('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.folderId, folder.id);
		});

		test('親フォルダを無しにできる', async () => {
			const file = (await uploadFile(alice)).body;

			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			await api('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id,
			}, alice);

			const res = await api('/drive/files/update', {
				fileId: file.id,
				folderId: null,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.folderId, null);
		});

		test('他人のフォルダには入れられない', async () => {
			const file = (await uploadFile(alice)).body;
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, bob)).body;

			const res = await api('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('存在しないフォルダで怒られる', async () => {
			const file = (await uploadFile(alice)).body;

			const res = await api('/drive/files/update', {
				fileId: file.id,
				folderId: '000000000000000000000000',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('不正なフォルダIDで怒られる', async () => {
			const file = (await uploadFile(alice)).body;

			const res = await api('/drive/files/update', {
				fileId: file.id,
				folderId: 'foo',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('ファイルが存在しなかったら怒る', async () => {
			const res = await api('/drive/files/update', {
				fileId: '000000000000000000000000',
				name: 'いちごパスタ.png',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('間違ったIDで怒られる', async () => {
			const res = await api('/drive/files/update', {
				fileId: 'kyoppie',
				name: 'いちごパスタ.png',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		//#endregion
		//#region フォルダの作成(drive/folders/create)

		test('フォルダを作成できる', async () => {
			const res = await api('/drive/folders/create', {
				name: 'test',
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'test');
		});

		//#endregion
		//#region フォルダの更新(drive/folders/update)

		test('名前を更新できる', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				name: 'new name',
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'new name');
		});

		test('他人のフォルダを更新できない', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, bob)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				name: 'new name',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('親フォルダを更新できる', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const parentFolder = (await api('/drive/folders/create', {
				name: 'parent',
			}, alice)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.parentId, parentFolder.id);
		});

		test('親フォルダを無しに更新できる', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const parentFolder = (await api('/drive/folders/create', {
				name: 'parent',
			}, alice)).body;
			await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id,
			}, alice);

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: null,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.parentId, null);
		});

		test('他人のフォルダを親フォルダに設定できない', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const parentFolder = (await api('/drive/folders/create', {
				name: 'parent',
			}, bob)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('フォルダが循環するような構造にできない', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const parentFolder = (await api('/drive/folders/create', {
				name: 'parent',
			}, alice)).body;
			await api('/drive/folders/update', {
				folderId: parentFolder.id,
				parentId: folder.id,
			}, alice);

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('フォルダが循環するような構造にできない(再帰的)', async () => {
			const folderA = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const folderB = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			const folderC = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;
			await api('/drive/folders/update', {
				folderId: folderB.id,
				parentId: folderA.id,
			}, alice);
			await api('/drive/folders/update', {
				folderId: folderC.id,
				parentId: folderB.id,
			}, alice);

			const res = await api('/drive/folders/update', {
				folderId: folderA.id,
				parentId: folderC.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('フォルダが循環するような構造にできない(自身)', async () => {
			const folderA = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			const res = await api('/drive/folders/update', {
				folderId: folderA.id,
				parentId: folderA.id,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('存在しない親フォルダを設定できない', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: '000000000000000000000000',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('不正な親フォルダIDで怒られる', async () => {
			const folder = (await api('/drive/folders/create', {
				name: 'test',
			}, alice)).body;

			const res = await api('/drive/folders/update', {
				folderId: folder.id,
				parentId: 'foo',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('存在しないフォルダを更新できない', async () => {
			const res = await api('/drive/folders/update', {
				folderId: '000000000000000000000000',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('不正なフォルダIDで怒られる', async () => {
			const res = await api('/drive/folders/update', {
				folderId: 'foo',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		//#endregion
	});

	describe('ミュート(ユーザー)', () => {
		afterAll(async () => {
			await api('/mute/delete', {
				userId: carol.id,
			}, alice);
		});

		test('ミュート作成', async () => {
			const res = await api('/mute/create', {
				userId: carol.id,
			}, alice);

			assert.strictEqual(res.status, 204);
		});
	});

	describe('ノート(RN、引用、アンケ、リアクション含む)', () => {
		let Notes: any;
		let jpgNote: any;
		let pngNote: any;
		let jpgPngNote: any;

		/** フォロワー */
		let follower: any;
		/** 非フォロワー */
		let other: any;
		/** 非フォロワーでもリプライやメンションをされた人 */
		let target: any;
		/** specified mentionでmentionを飛ばされる人 */
		let target2: any;

		/** public-post */
		let pub: any;
		/** home-post */
		let home: any;
		/** followers-post */
		let fol: any;
		/** specified-post */
		let spe: any;

		/** public-reply to target's post */
		let pubR: any;
		/** home-reply to target's post */
		let homeR: any;
		/** followers-reply to target's post */
		let folR: any;
		/** specified-reply to target's post */
		let speR: any;

		/** public-mention to target */
		let pubM: any;
		/** home-mention to target */
		let homeM: any;
		/** followers-mention to target */
		let folM: any;
		/** specified-mention to target */
		let speM: any;

		/** reply target post */
		let tgt: any;

		const follow = async (follower: any, followee: any) => {
			await Followings.save({
				id: 'a',
				createdAt: new Date(),
				followerId: follower.id,
				followeeId: followee.id,
				followerHost: follower.host,
				followerInbox: null,
				followerSharedInbox: null,
				followeeHost: followee.host,
				followeeInbox: null,
				followeeSharedInbox: null,
			});
		};

		let Followings: any;

		// Local users
		let ayano: any;
		let kyoko: any;
		let chitose: any;

		// Remote users
		let akari: any;
		let chinatsu: any;

		let kyokoNote: any;
		let list: any;

		beforeAll(async () => {
			const connection = await initTestDb(true);
			Notes = connection.getRepository(Note);
		}, 1000 * 60 * 2);

		beforeAll(async () => {
			const jpg = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');
			const png = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.png');
			jpgNote = await post(alice, {
				fileIds: [jpg.id],
			});
			pngNote = await post(alice, {
				fileIds: [png.id],
			});
			jpgPngNote = await post(alice, {
				fileIds: [jpg.id, png.id],
			});
		}, 1000 * 60 * 2);

		beforeAll(async () => {
			// signup
			follower = await signup({ username: 'follower' });
			other = await signup({ username: 'other' });
			target = await signup({ username: 'target' });
			target2 = await signup({ username: 'target2' });

			// follow alice <= follower
			await api('/following/create', { userId: alice.id }, follower);

			// normal posts
			pub = await post(alice, { text: 'x', visibility: 'public' });
			home = await post(alice, { text: 'x', visibility: 'home' });
			fol = await post(alice, { text: 'x', visibility: 'followers' });
			spe = await post(alice, { text: 'x', visibility: 'specified', visibleUserIds: [target.id] });

			// replies
			tgt = await post(target, { text: 'y', visibility: 'public' });
			pubR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'public' });
			homeR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'home' });
			folR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'followers' });
			speR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'specified' });

			// mentions
			pubM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'public' });
			homeM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'home' });
			folM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'followers' });
			speM = await post(alice, { text: '@target2 x', replyId: tgt.id, visibility: 'specified' });
		});

		beforeAll(async () => {
			const connection = await initTestDb(true);
			Followings = connection.getRepository(Following);

			ayano = await signup({ username: 'ayano' });
			kyoko = await signup({ username: 'kyoko' });
			chitose = await signup({ username: 'chitose' });

			akari = await signup({ username: 'akari', host: 'example.com' });
			chinatsu = await signup({ username: 'chinatsu', host: 'example.com' });

			kyokoNote = await post(kyoko, { text: 'foo' });

			// Follow: ayano => kyoko
			await api('following/create', { userId: kyoko.id }, ayano);

			// Follow: ayano => akari
			await follow(ayano, akari);

			// List: chitose => ayano, kyoko
			list = await api('users/lists/create', {
				name: 'my list',
			}, chitose).then(x => x.body);

			await api('users/lists/push', {
				listId: list.id,
				userId: ayano.id,
			}, chitose);

			await api('users/lists/push', {
				listId: list.id,
				userId: kyoko.id,
			}, chitose);
		}, 1000 * 60 * 2);

		//#region 投稿の作成(notes/create)

		test('投稿できる', async () => {
			const post = {
				text: 'test',
			};

			const res = await api('/notes/create', post, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.text, post.text);
		});

		test('ファイルを添付できる', async () => {
			const file = await uploadUrl(alice, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

			const res = await api('/notes/create', {
				fileIds: [file.id],
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.deepStrictEqual(res.body.createdNote.fileIds, [file.id]);
		}, 1000 * 10);

		test('他人のファイルで怒られる', async () => {
			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/Lenna.jpg');

			const res = await api('/notes/create', {
				text: 'test',
				fileIds: [file.id],
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
			assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
		}, 1000 * 10);

		test('存在しないファイルで怒られる', async () => {
			const res = await api('/notes/create', {
				text: 'test',
				fileIds: ['000000000000000000000000'],
			}, alice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
			assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
		});

		test('不正なファイルIDで怒られる', async () => {
			const res = await api('/notes/create', {
				fileIds: ['kyoppie'],
			}, alice);
			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.code, 'NO_SUCH_FILE');
			assert.strictEqual(res.body.error.id, 'b6992544-63e7-67f0-fa7f-32444b1b5306');
		});

		test('返信できる', async () => {
			const bobPost = await post(bob, {
				text: 'foo',
			});

			const alicePost = {
				text: 'bar',
				replyId: bobPost.id,
			};

			const res = await api('/notes/create', alicePost, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.text, alicePost.text);
			assert.strictEqual(res.body.createdNote.replyId, alicePost.replyId);
			assert.strictEqual(res.body.createdNote.reply.text, bobPost.text);
		});

		test('renoteできる', async () => {
			const bobPost = await post(bob, {
				text: 'test',
			});

			const alicePost = {
				renoteId: bobPost.id,
			};

			const res = await api('/notes/create', alicePost, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
			assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
		});

		test('引用renoteできる', async () => {
			const bobPost = await post(bob, {
				text: 'test',
			});

			const alicePost = {
				text: 'test',
				renoteId: bobPost.id,
			};

			const res = await api('/notes/create', alicePost, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.text, alicePost.text);
			assert.strictEqual(res.body.createdNote.renoteId, alicePost.renoteId);
			assert.strictEqual(res.body.createdNote.renote.text, bobPost.text);
		});

		test('visibility: followersでrenoteできる', async () => {
			const createRes = await api('/notes/create', {
				text: 'test',
				visibility: 'followers',
			}, alice);

			assert.strictEqual(createRes.status, 200);

			const renoteId = createRes.body.createdNote.id;
			const renoteRes = await api('/notes/create', {
				visibility: 'followers',
				renoteId,
			}, alice);

			assert.strictEqual(renoteRes.status, 200);
			assert.strictEqual(renoteRes.body.createdNote.renoteId, renoteId);
			assert.strictEqual(renoteRes.body.createdNote.visibility, 'followers');

			const deleteRes = await api('/notes/delete', {
				noteId: renoteRes.body.createdNote.id,
			}, alice);

			assert.strictEqual(deleteRes.status, 204);
		});

		test('文字数ぎりぎりで怒られない', async () => {
			const post = {
				text: '!'.repeat(3000),
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 200);
		});

		test('文字数オーバーで怒られる', async () => {
			const post = {
				text: '!'.repeat(3001),
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 400);
		});

		test('存在しないリプライ先で怒られる', async () => {
			const post = {
				text: 'test',
				replyId: '000000000000000000000000',
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 400);
		});

		test('存在しないrenote対象で怒られる', async () => {
			const post = {
				renoteId: '000000000000000000000000',
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 400);
		});

		test('不正なリプライ先IDで怒られる', async () => {
			const post = {
				text: 'test',
				replyId: 'foo',
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 400);
		});

		test('不正なrenote対象IDで怒られる', async () => {
			const post = {
				renoteId: 'foo',
			};
			const res = await api('/notes/create', post, alice);
			assert.strictEqual(res.status, 400);
		});

		test('存在しないユーザーにメンションできる', async () => {
			const post = {
				text: '@ghost yo',
			};

			const res = await api('/notes/create', post, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.text, post.text);
		});

		test('同じユーザーに複数メンションしても内部的にまとめられる', async () => {
			const post = {
				text: '@bob @bob @bob yo',
			};

			const res = await api('/notes/create', post, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.text, post.text);

			const noteDoc = await Notes.findOneBy({ id: res.body.createdNote.id });
			assert.deepStrictEqual(noteDoc.mentions, [bob.id]);
		});

		test('ブロックされているユーザーに返信できない', async () => {
			const note = await post(alice, { text: 'hello' });

			const res = await api('/notes/create', { replyId: note.id, text: 'yo' }, userBlockedByAlice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.id, 'b390d7e1-8a5e-46ed-b625-06271cafd3d3');
		});

		test('ブロックされているユーザーのノートをRenoteできない', async () => {
			const note = await post(alice, { text: 'hello' });

			const res = await api('/notes/create', { renoteId: note.id, text: 'yo' }, userBlockedByAlice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.id, 'b390d7e1-8a5e-46ed-b625-06271cafd3d3');
		});

		describe('添付ファイル情報', () => {
			test('ファイルを添付した場合、投稿成功時にファイル情報入りのレスポンスが帰ってくる', async () => {
				const file = await uploadFile(alice);
				const res = await api('/notes/create', {
					fileIds: [file.body.id],
				}, alice);

				assert.strictEqual(res.status, 200);
				assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
				assert.strictEqual(res.body.createdNote.files.length, 1);
				assert.strictEqual(res.body.createdNote.files[0].id, file.body.id);
			});

			test('ファイルを添付した場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
				const file = await uploadFile(alice);
				const createdNote = await api('/notes/create', {
					fileIds: [file.body.id],
				}, alice);

				assert.strictEqual(createdNote.status, 200);

				const res = await api('/notes', {
					withFiles: true,
				}, alice);

				assert.strictEqual(res.status, 200);
				assert.strictEqual(Array.isArray(res.body), true);
				const myNote = res.body.find((note: { id: string; files: { id: string }[] }) => note.id === createdNote.body.createdNote.id);
				assert.notEqual(myNote, null);
				assert.strictEqual(myNote.files.length, 1);
				assert.strictEqual(myNote.files[0].id, file.body.id);
			});

			test('ファイルが添付されたノートをリノートした場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
				const file = await uploadFile(alice);
				const createdNote = await api('/notes/create', {
					fileIds: [file.body.id],
				}, alice);

				assert.strictEqual(createdNote.status, 200);

				const renoted = await api('/notes/create', {
					renoteId: createdNote.body.createdNote.id,
				}, alice);
				assert.strictEqual(renoted.status, 200);

				const res = await api('/notes', {
					renote: true,
				}, alice);

				assert.strictEqual(res.status, 200);
				assert.strictEqual(Array.isArray(res.body), true);
				const myNote = res.body.find((note: { id: string }) => note.id === renoted.body.createdNote.id);
				assert.notEqual(myNote, null);
				assert.strictEqual(myNote.renote.files.length, 1);
				assert.strictEqual(myNote.renote.files[0].id, file.body.id);
			});

			test('ファイルが添付されたノートに返信した場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
				const file = await uploadFile(alice);
				const createdNote = await api('/notes/create', {
					fileIds: [file.body.id],
				}, alice);

				assert.strictEqual(createdNote.status, 200);

				const reply = await api('/notes/create', {
					replyId: createdNote.body.createdNote.id,
					text: 'this is reply',
				}, alice);
				assert.strictEqual(reply.status, 200);

				const res = await api('/notes', {
					reply: true,
				}, alice);

				assert.strictEqual(res.status, 200);
				assert.strictEqual(Array.isArray(res.body), true);
				const myNote = res.body.find((note: { id: string }) => note.id === reply.body.createdNote.id);
				assert.notEqual(myNote, null);
				assert.strictEqual(myNote.reply.files.length, 1);
				assert.strictEqual(myNote.reply.files[0].id, file.body.id);
			});

			test('ファイルが添付されたノートへの返信をリノートした場合、タイムラインでファイル情報入りのレスポンスが帰ってくる', async () => {
				const file = await uploadFile(alice);
				const createdNote = await api('/notes/create', {
					fileIds: [file.body.id],
				}, alice);

				assert.strictEqual(createdNote.status, 200);

				const reply = await api('/notes/create', {
					replyId: createdNote.body.createdNote.id,
					text: 'this is reply',
				}, alice);
				assert.strictEqual(reply.status, 200);

				const renoted = await api('/notes/create', {
					renoteId: reply.body.createdNote.id,
				}, alice);
				assert.strictEqual(renoted.status, 200);

				const res = await api('/notes', {
					renote: true,
				}, alice);

				assert.strictEqual(res.status, 200);
				assert.strictEqual(Array.isArray(res.body), true);
				const myNote = res.body.find((note: { id: string }) => note.id === renoted.body.createdNote.id);
				assert.notEqual(myNote, null);
				assert.strictEqual(myNote.renote.reply.files.length, 1);
				assert.strictEqual(myNote.renote.reply.files[0].id, file.body.id);
			});

			test('NSFWが強制されている場合変更できない', async () => {
				const file = await uploadFile(alice);

				const res = await api('admin/roles/create', {
					name: 'test',
					description: '',
					color: null,
					iconUrl: null,
					displayOrder: 0,
					target: 'manual',
					condFormula: {},
					isAdministrator: false,
					isModerator: false,
					isPublic: false,
					isExplorable: false,
					asBadge: false,
					canEditMembersByModerator: false,
					policies: {
						alwaysMarkNsfw: {
							useDefault: false,
							priority: 0,
							value: true,
						},
					},
				}, root);

				assert.strictEqual(res.status, 200);

				const assign = await api('admin/roles/assign', {
					userId: alice.id,
					roleId: res.body.id,
				}, root);

				assert.strictEqual(assign.status, 204);
				assert.strictEqual(file.body.isSensitive, false);

				const nsfwfile = await uploadFile(alice);

				assert.strictEqual(nsfwfile.status, 200);
				assert.strictEqual(nsfwfile.body.isSensitive, true);

				const liftnsfw = await api('drive/files/update', {
					fileId: nsfwfile.body.id,
					isSensitive: false,
				}, alice);

				assert.strictEqual(liftnsfw.status, 400);
				assert.strictEqual(liftnsfw.body.error.code, 'RESTRICTED_BY_ROLE');

				const oldaddnsfw = await api('drive/files/update', {
					fileId: file.body.id,
					isSensitive: true,
				}, alice);

				assert.strictEqual(oldaddnsfw.status, 200);

				await api('admin/roles/unassign', {
					userId: alice.id,
					roleId: res.body.id,
				});

				await api('admin/roles/delete', {
					roleId: res.body.id,
				}, root);
			});
		});

		test('センシティブな投稿はhomeになる (単語指定)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'test',
				],
			}, root);

			assert.strictEqual(sensitive.status, 204);

			await new Promise(x => setTimeout(x, 1000));

			const note1 = await api('/notes/create', {
				text: 'hogetesthuge',
			}, alice);

			assert.strictEqual(note1.status, 200);
			assert.strictEqual(note1.body.createdNote.visibility, 'home');
		});

		test('センシティブな投稿はhomeになる (正規表現)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'/Test/i',
				],
			}, root);

			assert.strictEqual(sensitive.status, 204);

			const note2 = await api('/notes/create', {
				text: 'hogetesthuge',
			}, alice);

			assert.strictEqual(note2.status, 200);
			assert.strictEqual(note2.body.createdNote.visibility, 'home');
		});

		test('センシティブな投稿はhomeになる (スペースアンド)', async () => {
			const sensitive = await api('admin/update-meta', {
				sensitiveWords: [
					'Test hoge',
				],
			}, root);

			assert.strictEqual(sensitive.status, 204);

			const note2 = await api('/notes/create', {
				text: 'hogeTesthuge',
			}, alice);

			assert.strictEqual(note2.status, 200);
			assert.strictEqual(note2.body.createdNote.visibility, 'home');
		});

		test('にアンケートを添付できる', async () => {
			const res = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['foo', 'bar'],
				},
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.createdNote.poll != null, true);
		});

		test('のアンケートの選択肢が無くて怒られる', async () => {
			const res = await api('/notes/create', {
				poll: {},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('のアンケートの選択肢が無くて怒られる (空の配列)', async () => {
			const res = await api('/notes/create', {
				poll: {
					choices: [],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test('のアンケートの選択肢が1つで怒られる', async () => {
			const res = await api('/notes/create', {
				poll: {
					choices: ['Strawberry Pasta'],
				},
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		//#endregion
		//#region 投稿の削除(notes/delete)

		test('を削除できる', async () => {
			const mainNoteRes = await api('notes/create', {
				text: 'main post',
			}, alice);
			const replyOneRes = await api('notes/create', {
				text: 'reply one',
				replyId: mainNoteRes.body.createdNote.id,
			}, alice);
			const replyTwoRes = await api('notes/create', {
				text: 'reply two',
				replyId: mainNoteRes.body.createdNote.id,
			}, alice);

			const deleteOneRes = await api('notes/delete', {
				noteId: replyOneRes.body.createdNote.id,
			}, alice);

			assert.strictEqual(deleteOneRes.status, 204);
			let mainNote = await Notes.findOneBy({ id: mainNoteRes.body.createdNote.id });
			assert.strictEqual(mainNote.repliesCount, 1);

			const deleteTwoRes = await api('notes/delete', {
				noteId: replyTwoRes.body.createdNote.id,
			}, alice);

			assert.strictEqual(deleteTwoRes.status, 204);
			mainNote = await Notes.findOneBy({ id: mainNoteRes.body.createdNote.id });
			assert.strictEqual(mainNote.repliesCount, 0);
		});

		//#endregion
		//#region 投稿の取得(notes/show)

		const show = async (noteId: any, by: any) => {
			return await api('/notes/show', {
				noteId,
			}, by);
		};

		// public
		test('public-postを自分が見れる', async () => {
			const res = await show(pub.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-postをフォロワーが見れる', async () => {
			const res = await show(pub.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-postを非フォロワーが見れる', async () => {
			const res = await show(pub.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-postを未認証が見れる', async () => {
			const res = await show(pub.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// home
		test('home-postを自分が見れる', async () => {
			const res = await show(home.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-postをフォロワーが見れる', async () => {
			const res = await show(home.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-postを非フォロワーが見れる', async () => {
			const res = await show(home.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-postを未認証が見れる', async () => {
			const res = await show(home.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// followers
		test('followers-postを自分が見れる', async () => {
			const res = await show(fol.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('followers-postをフォロワーが見れる', async () => {
			const res = await show(fol.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('followers-postを非フォロワーが見れない', async () => {
			const res = await show(fol.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('followers-postを未認証が見れない', async () => {
			const res = await show(fol.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('specified-postを自分が見れる', async () => {
			const res = await show(spe.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('specified-postを指定ユーザーが見れる', async () => {
			const res = await show(spe.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('specified-postをフォロワーが見れない', async () => {
			const res = await show(spe.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-postを非フォロワーが見れない', async () => {
			const res = await show(spe.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-postを未認証が見れない', async () => {
			const res = await show(spe.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// public
		test('public-replyを自分が見れる', async () => {
			const res = await show(pubR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-replyをされた人が見れる', async () => {
			const res = await show(pubR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-replyをフォロワーが見れる', async () => {
			const res = await show(pubR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-replyを非フォロワーが見れる', async () => {
			const res = await show(pubR.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('public-replyを未認証が見れる', async () => {
			const res = await show(pubR.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// home
		test('home-replyを自分が見れる', async () => {
			const res = await show(homeR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-replyをされた人が見れる', async () => {
			const res = await show(homeR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-replyをフォロワーが見れる', async () => {
			const res = await show(homeR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-replyを非フォロワーが見れる', async () => {
			const res = await show(homeR.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('home-replyを未認証が見れる', async () => {
			const res = await show(homeR.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// followers
		test('followers-replyを自分が見れる', async () => {
			const res = await show(folR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('followers-replyを非フォロワーでもリプライされていれば見れる', async () => {
			const res = await show(folR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('followers-replyをフォロワーが見れる', async () => {
			const res = await show(folR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('followers-replyを非フォロワーが見れない', async () => {
			const res = await show(folR.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('followers-replyを未認証が見れない', async () => {
			const res = await show(folR.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('specified-replyを自分が見れる', async () => {
			const res = await show(speR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('specified-replyを指定ユーザーが見れる', async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('specified-replyをされた人が指定されてなくても見れる', async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('specified-replyをフォロワーが見れない', async () => {
			const res = await show(speR.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-replyを非フォロワーが見れない', async () => {
			const res = await show(speR.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-replyを未認証が見れない', async () => {
			const res = await show(speR.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// public
		test('public-mentionを自分が見れる', async () => {
			const res = await show(pubM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('public-mentionをされた人が見れる', async () => {
			const res = await show(pubM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('public-mentionをフォロワーが見れる', async () => {
			const res = await show(pubM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('public-mentionを非フォロワーが見れる', async () => {
			const res = await show(pubM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('public-mentionを未認証が見れる', async () => {
			const res = await show(pubM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		});

		// home
		test('home-mentionを自分が見れる', async () => {
			const res = await show(homeM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('home-mentionをされた人が見れる', async () => {
			const res = await show(homeM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('home-mentionをフォロワーが見れる', async () => {
			const res = await show(homeM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('home-mentionを非フォロワーが見れる', async () => {
			const res = await show(homeM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('home-mentionを未認証が見れる', async () => {
			const res = await show(homeM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		});

		// followers
		test('followers-mentionを自分が見れる', async () => {
			const res = await show(folM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('followers-mentionをメンションされていれば非フォロワーでも見れる', async () => {
			const res = await show(folM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('followers-mentionをフォロワーが見れる', async () => {
			const res = await show(folM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('followers-mentionを非フォロワーが見れない', async () => {
			const res = await show(folM.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('followers-mentionを未認証が見れない', async () => {
			const res = await show(folM.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('specified-mentionを自分が見れる', async () => {
			const res = await show(speM.id, alice);
			assert.strictEqual(res.body.text, '@target2 x');
		});

		test('specified-mentionを指定ユーザーが見れる', async () => {
			const res = await show(speM.id, target);
			assert.strictEqual(res.body.text, '@target2 x');
		});

		test('specified-mentionをされた人が指定されてなかったら見れない', async () => {
			const res = await show(speM.id, target2);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-mentionをフォロワーが見れない', async () => {
			const res = await show(speM.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-mentionを非フォロワーが見れない', async () => {
			const res = await show(speM.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('specified-mentionを未認証が見れない', async () => {
			const res = await show(speM.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		//#endregion
		//#region アンケートへの投票(notes/polls/vote)

		test('のアンケートに投票できる', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('のアンケートは複数投票できない', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
				},
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('のアンケートは許可されている場合は複数投票できる', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					multiple: true,
				},
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 0,
			}, alice);

			await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 2,
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('のアンケートは締め切られている場合は投票できない', async () => {
			const { body } = await api('/notes/create', {
				text: 'test',
				poll: {
					choices: ['sakura', 'izumi', 'ako'],
					expiredAfter: 1,
				},
			}, alice);

			await new Promise(x => setTimeout(x, 2));

			const res = await api('/notes/polls/vote', {
				noteId: body.createdNote.id,
				choice: 1,
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		//#endregion
		//#region リアクションの作成(notes/reactions/create)

		test('にリアクションできる', async () => {
			const bobPost = await post(bob, { text: 'hi' });

			const res = await api('/notes/reactions/create', {
				noteId: bobPost.id,
				reaction: '🚀',
			}, alice);

			assert.strictEqual(res.status, 204);

			const resNote = await api('/notes/show', {
				noteId: bobPost.id,
			}, alice);

			assert.strictEqual(resNote.status, 200);
			assert.strictEqual(resNote.body.reactions['🚀'], 1);
		});

		test('自分の投稿にもリアクションできる', async () => {
			const myPost = await post(alice, { text: 'hi' });

			const res = await api('/notes/reactions/create', {
				noteId: myPost.id,
				reaction: '🚀',
			}, alice);

			assert.strictEqual(res.status, 204);
		});

		test('二重にリアクションすると上書きされる', async () => {
			const bobPost = await post(bob, { text: 'hi' });

			await api('/notes/reactions/create', {
				noteId: bobPost.id,
				reaction: '🥰',
			}, alice);

			const res = await api('/notes/reactions/create', {
				noteId: bobPost.id,
				reaction: '🚀',
			}, alice);

			assert.strictEqual(res.status, 204);

			const resNote = await api('/notes/show', {
				noteId: bobPost.id,
			}, alice);

			assert.strictEqual(resNote.status, 200);
			assert.deepStrictEqual(resNote.body.reactions, { '🚀': 1 });
		});

		test('存在しない投稿にはリアクションできない', async () => {
			const res = await api('/notes/reactions/create', {
				noteId: '000000000000000000000000',
				reaction: '🚀',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('空のパラメータでリアクションすると怒られる', async () => {
			const res = await api('/notes/reactions/create', {}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('間違ったIDでリアクションすると怒られる', async () => {
			const res = await api('/notes/reactions/create', {
				noteId: 'kyoppie',
				reaction: '🚀',
			}, alice);

			assert.strictEqual(res.status, 400);
		});

		test('ブロックされているユーザーにリアクションできない', async () => {
			const note = await post(alice, { text: 'hello' });

			const res = await api('/notes/reactions/create', { noteId: note.id, reaction: '👍' }, userBlockedByAlice);

			assert.strictEqual(res.status, 400);
			assert.strictEqual(res.body.error.id, '20ef5475-9f38-4e4c-bd33-de6d979498ec');
		});

		//#endregion
		//#region リプライの取得(notes/replies)

		test('リプライからfollowers-reply が フォロワーから見れる', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('リプライからfollowers-reply が 非フォロワー (リプライ先ではない) から見れない', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes.length, 0);
		});

		test('リプライからfollowers-reply が 非フォロワー (リプライ先である) から見れる', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('自分に閲覧権限のない投稿は含まれない', async () => {
			const alicePost = await post(alice, {
				text: 'foo',
			});

			await post(bob, {
				replyId: alicePost.id,
				text: 'bar',
				visibility: 'specified',
				visibleUserIds: [alice.id],
			});

			const res = await api('/notes/replies', {
				noteId: alicePost.id,
			}, carol);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 0);
		});

		//#endregion
		//#region タイムライン(notes/timeline)

		test('タイムラインからpublic-post が 自分が見れる', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, alice);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === pub.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('タイムラインからpublic-post が 非フォロワーから見れない', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === pub.id);
			assert.strictEqual(notes.length, 0);
		});

		test('タイムラインからfollowers-post が フォロワーから見れる', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === fol.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('タイムラインにフォロワー限定投稿が含まれる', async () => {
			await api('/following/create', {
				userId: carol.id,
			}, dave);

			const carolPost = await post(carol, {
				text: 'foo',
				visibility: 'followers',
			});

			const res = await api('/notes/timeline', {}, dave);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body[0].id, carolPost.id);
		});

		//#endregion
		//#region ローカルタイムライン(notes/local-timeline)

		test('タイムライン(LTL)にブロックされているユーザーの投稿が含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });

			const res = await api('/notes/local-timeline', {}, userBlockedByAlice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
		});

		test('タイムラインにミュートしているユーザーの投稿が含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(userMutedByAlice, { text: 'hi' });

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('タイムラインにミュートしているユーザーの投稿のRenoteが含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const carolNote = await post(userMutedByAlice, { text: 'hi' });
			const bobNote = await post(bob, {
				renoteId: carolNote.id,
			});

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('タイムラインにリノートミュートしているユーザーのリノートが含まれない', async () => {
			const bobNote = await post(bob, { text: 'hi' });
			const carolRenote = await post(userRnMutedByAlice, { renoteId: bobNote.id });
			const carolNote = await post(userRnMutedByAlice, { text: 'hi' });

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolRenote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
		});

		test('タイムラインにリノートミュートしているユーザーの引用が含まれる', async () => {
			const bobNote = await post(bob, { text: 'hi' });
			const carolRenote = await post(userRnMutedByAlice, { renoteId: bobNote.id, text: 'kore' });
			const carolNote = await post(userRnMutedByAlice, { text: 'hi' });

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolRenote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
		});

		//#endregion
		//#region タイムライン(notes/mentions)

		test('「自分宛ての投稿」からfollowers-reply が 非フォロワー (リプライ先である) から見れる', async () => {
			const res = await api('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('「自分宛ての投稿」からfollowers-mention が 非フォロワー (メンション先である) から見れる', async () => {
			const res = await api('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folM.id);
			assert.strictEqual(notes[0].text, '@target x');
		});

		test('「自分宛ての投稿」にミュートしているユーザーの投稿が含まれない', async () => {
			const bobNote = await post(bob, { text: '@alice hi' });
			const carolNote = await post(userMutedByAlice, { text: '@alice hi' });

			const res = await api('/notes/mentions', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('「自分宛ての投稿」にミュートしているスレッドの投稿が含まれない', async () => {
			const bobNote = await post(bob, { text: '@alice @carol root note' });
			const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

			await api('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

			const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
			const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });

			const res = await api('/notes/mentions', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolReply.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolReplyWithoutMention.id), false);
		});

		//#endregion
		//#region ユーザーのノート(users/notes)

		test('ファイルタイプ指定 (jpg)', async () => {
			const res = await api('/users/notes', {
				userId: alice.id,
				fileType: ['image/jpeg'],
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
		});

		test('ファイルタイプ指定 (jpg or png)', async () => {
			const res = await api('/users/notes', {
				userId: alice.id,
				fileType: ['image/jpeg', 'image/png'],
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === pngNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === jpgPngNote.id), true);
		});

		//#endregion

		describe('クリップ', () => {
			let aliceClip: Clip;

			const sampleNotes = (): Note[] => [
				aliceNote, aliceHomeNote, aliceFollowersNote, aliceSpecifiedNote,
				bobNote, bobHomeNote, bobFollowersNote, bobSpecifiedNote,
			];

			beforeEach(async () => {
				aliceClip = await clip(alice, { isPublic: false });
			});

			afterEach(async () => {
				await apiOk({
					endpoint: 'clips/delete',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
			});

			//#region クリップにノートを追加(clips/add-note)

			test('を追加できる。', async () => {
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: aliceNote.id },
					user: alice,
				});
				const res = await await apiOk({
					endpoint: 'clips/show',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});
				assert.strictEqual(res.lastClippedAt, new Date(res.lastClippedAt ?? '').toISOString());
				assert.deepStrictEqual(await apiOk({
					endpoint: 'clips/notes',
					parameters: { clipId: aliceClip.id },
					user: alice,
				}), [aliceNote]);

				// 他人の非公開ノートも突っ込める
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: bobHomeNote.id },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: bobFollowersNote.id },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: bobSpecifiedNote.id },
					user: alice,
				});
			});

			test('として同じノートを二回紐づけることはできない', async () => {
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: aliceNote.id },
					user: alice,
				});
				await apiError({
					endpoint: 'clips/add-note',
					parameters: {
						clipId: aliceClip.id,
						noteId: aliceNote.id,
					},
					user: alice,
				}, {
					status: 400,
					code: 'ALREADY_CLIPPED',
					id: '734806c4-542c-463a-9311-15c512803965',
				});
			});

			// TODO: 17000msくらいかかる...
			test('をポリシーで定められた上限いっぱい(200)を超えて追加はできない。', async () => {
				const noteLimit = DEFAULT_POLICIES.noteEachClipsLimit + 1;
				const noteList = await Promise.all([...Array(noteLimit)].map((_, i) => post(alice, {
					text: `test ${i}`,
				}) as unknown)) as Note[];
				await Promise.all(noteList.map(async s => apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: s.id },
					user: alice,
				})));

				await apiError({
					endpoint: '/clips/add-note',
					parameters: {
						clipId: aliceClip.id,
						noteId: aliceNote.id,
					},
					user: alice,
				}, {
					status: 400,
					code: 'TOO_MANY_CLIP_NOTES',
					id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118',
				});
			});

			test('は他人のクリップへ追加できない。', async () => await apiError({
				endpoint: '/clips/add-note',
				parameters: {
					clipId: aliceClip.id,
					noteId: aliceNote.id,
				},
				user: bob,
			}, {
				status: 400,
				code: 'NO_SUCH_CLIP',
				id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
			}));

			test.each([
				{ label: 'clipId未指定', parameters: { clipId: undefined } },
				{ label: 'noteId未指定', parameters: { noteId: undefined } },
				{
					label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assetion: {
						code: 'NO_SUCH_CLIP',
						id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
					},
				},
				{
					label: '存在しないノート', parameters: { noteId: 'xxxxxx' }, assetion: {
						code: 'NO_SUCH_NOTE',
						id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
					},
				},
				{
					label: '他人のクリップ', user: (): object => bob, assetion: {
						code: 'NO_SUCH_CLIP',
						id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
					},
				},
			])('の追加は$labelだとできない', async ({ parameters, user, assetion }) => apiError({
				endpoint: '/clips/add-note',
				parameters: {
					clipId: aliceClip.id,
					noteId: aliceNote.id,
					...parameters,
				},
				user: (user ?? ((): User => alice))(),
			}, {
				status: 400,
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				...assetion,
			}));

			//#endregion
			//#region クリップからノートを削除(clips/remove-note)

			test('を削除できる。', async () => {
				await apiOk({
					endpoint: 'clips/add-note',
					parameters: { clipId: aliceClip.id, noteId: aliceNote.id },
					user: alice,
				});
				await apiOk({
					endpoint: 'clips/remove-note',
					parameters: { clipId: aliceClip.id, noteId: aliceNote.id },
					user: alice,
				});
				assert.deepStrictEqual(await apiOk({
					endpoint: 'clips/notes',
					parameters: { clipId: aliceClip.id },
					user: alice,
				}), []);
			});

			test.each([
				{ label: 'clipId未指定', parameters: { clipId: undefined } },
				{ label: 'noteId未指定', parameters: { noteId: undefined } },
				{
					label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assetion: {
						code: 'NO_SUCH_CLIP',
						id: 'b80525c6-97f7-49d7-a42d-ebccd49cfd52', // add-noteと異なる
					},
				},
				{
					label: '存在しないノート', parameters: { noteId: 'xxxxxx' }, assetion: {
						code: 'NO_SUCH_NOTE',
						id: 'aff017de-190e-434b-893e-33a9ff5049d8', // add-noteと異なる
					},
				},
				{
					label: '他人のクリップ', user: (): object => bob, assetion: {
						code: 'NO_SUCH_CLIP',
						id: 'b80525c6-97f7-49d7-a42d-ebccd49cfd52', // add-noteと異なる
					},
				},
			])('の削除は$labelだとできない', async ({ parameters, user, assetion }) => apiError({
				endpoint: 'clips/remove-note',
				parameters: {
					clipId: aliceClip.id,
					noteId: aliceNote.id,
					...parameters,
				},
				user: (user ?? ((): User => alice))(),
			}, {
				status: 400,
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				...assetion,
			}));

			//#endregion
			//#region クリップのノートを取得(clips/notes-note)

			test('を取得できる。', async () => {
				const noteList = sampleNotes();
				for (const note of noteList) {
					await apiOk<void>({
						endpoint: '/clips/add-note',
						parameters: { clipId: aliceClip.id, noteId: note.id },
						user: alice,
					});
				}

				const res = await apiOk<Note[]>({
					endpoint: '/clips/notes',
					parameters: { clipId: aliceClip.id },
					user: alice,
				});

				// 自分のノートは非公開でも入れられるし、見える
				// 他人の非公開ノートは入れられるけど、除外される
				const expects = [
					aliceNote, aliceHomeNote, aliceFollowersNote, aliceSpecifiedNote,
					bobNote, bobHomeNote,
				];
				assert.deepStrictEqual(
					res.sort(compareBy(s => s.id)),
					expects.sort(compareBy(s => s.id)));
			});

			test('を始端IDとlimitで取得できる。', async () => {
				const noteList = sampleNotes();
				noteList.sort(compareBy(s => s.id));
				for (const note of noteList) {
					await apiOk({
						endpoint: '/clips/add-note',
						parameters: { clipId: aliceClip.id, noteId: note.id },
						user: alice,
					});
				}

				const res = await apiOk({
					endpoint: '/clips/notes',
					parameters: {
						clipId: aliceClip.id,
						sinceId: noteList[2].id,
						limit: 3,
					},
					user: alice,
				});

				// Promise.allで返ってくる配列はID順で並んでないのでソートして厳密比較
				const expects = [noteList[3], noteList[4], noteList[5]];
				assert.deepStrictEqual(
					res.sort(compareBy(s => s.id)),
					expects.sort(compareBy(s => s.id)));
			});

			test('をID範囲指定で取得できる。', async () => {
				const noteList = sampleNotes();
				noteList.sort(compareBy(s => s.id));
				for (const note of noteList) {
					await apiOk({
						endpoint: '/clips/add-note',
						parameters: { clipId: aliceClip.id, noteId: note.id },
						user: alice,
					});
				}

				const res = await apiOk<Note[]>({
					endpoint: '/clips/notes',
					parameters: {
						clipId: aliceClip.id,
						sinceId: noteList[1].id,
						untilId: noteList[4].id,
					},
					user: alice,
				});

				// Promise.allで返ってくる配列はID順で並んでないのでソートして厳密比較
				const expects = [noteList[2], noteList[3]];
				assert.deepStrictEqual(
					res.sort(compareBy(s => s.id)),
					expects.sort(compareBy(s => s.id)));
			});

			test.todo('Remoteのノートもクリップできる。どうテストしよう？');

			test('は他人のPublicなクリップからも取得できる。', async () => {
				const bobClip = await clip(bob, { isPublic: true });
				await apiOk({
					endpoint: '/clips/add-note',
					parameters: { clipId: bobClip.id, noteId: aliceNote.id },
					user: bob,
				});
				const res = await apiOk({
					endpoint: '/clips/notes',
					parameters: { clipId: bobClip.id },
					user: alice,
				});
				assert.deepStrictEqual(res, [aliceNote]);
			});

			test('はPublicなクリップなら認証なしでも取得できる。(非公開ノートはhideされて返ってくる)', async () => {
				const publicClip = await clip(bob, { isPublic: true });
				await apiOk({
					endpoint: '/clips/add-note',
					parameters: { clipId: publicClip.id, noteId: aliceNote.id },
					user: bob,
				});
				await apiOk({
					endpoint: '/clips/add-note',
					parameters: { clipId: publicClip.id, noteId: aliceHomeNote.id },
					user: bob,
				});
				await apiOk({
					endpoint: '/clips/add-note',
					parameters: { clipId: publicClip.id, noteId: aliceFollowersNote.id },
					user: bob,
				});
				await apiOk({
					endpoint: '/clips/add-note',
					parameters: { clipId: publicClip.id, noteId: aliceSpecifiedNote.id },
					user: bob,
				});

				const res = await apiOk<Note[]>({
					endpoint: '/clips/notes',
					parameters: { clipId: publicClip.id },
					user: undefined,
				});
				const expects = [
					aliceNote, aliceHomeNote,
					// 認証なしだと非公開ノートは結果には含むけどhideされる。
					hiddenNote(aliceFollowersNote), hiddenNote(aliceSpecifiedNote),
				];
				assert.deepStrictEqual(
					res.sort(compareBy(s => s.id)),
					expects.sort(compareBy(s => s.id)));
			});

			test.todo('ブロック、ミュートされたユーザーからの設定＆取得etc.');

			test.each([
				{ label: 'clipId未指定', parameters: { clipId: undefined } },
				{ label: 'limitゼロ', parameters: { limit: 0 } },
				{ label: 'limit最大+1', parameters: { limit: 101 } },
				{
					label: '存在しないクリップ', parameters: { clipId: 'xxxxxx' }, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
					},
				},
				{
					label: '他人のPrivateなクリップから', user: (): object => bob, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
					},
				},
				{
					label: '未認証でPrivateなクリップから', user: (): undefined => undefined, assertion: {
						code: 'NO_SUCH_CLIP',
						id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
					},
				},
			])('は$labelだと取得できない', async ({ parameters, user, assertion }) => apiError({
				endpoint: '/clips/notes',
				parameters: {
					clipId: aliceClip.id,
					...parameters,
				},
				user: (user ?? ((): User => alice))(),
			}, {
				status: 400,
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				...assertion,
			}));
			//#endregion
		});

		describe('アンテナ', () => {
			beforeEach(async () => {
				// テスト間で影響し合わないように毎回全部消す。
				const list = await api('/antennas/list', {}, alice);
				for (const antenna of list.body) {
					await api('/antennas/delete', { antennaId: antenna.id }, alice);
				}
			});

			//#region アンテナのノート取得(antennas/notes)

			test('から取得できること。', async () => {
				const keyword = 'キーワード';
				await post(bob, { text: `test ${keyword} beforehand` });
				const aliceAntenna = await antenna(alice, { keywords: [[keyword]] });
				const note = await post(bob, { text: `test ${keyword}` });
				const response = await apiOk({
					endpoint: 'antennas/notes',
					parameters: { antennaId: aliceAntenna.id },
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
			])('から取得できること（$label）', async ({ parameters, posts }) => {
				const aliceAntenna = await antenna(alice, { keywords: [[keyword]], ...parameters() });
				const notes = await posts.reduce(async (prev, current) => {
					// includedに関わらずnote()は評価して投稿する。
					const p = await prev;
					const n = await current.note();
					if (current.included) return p.concat(n);
					return p;
				}, Promise.resolve([] as Note[]));

				// alice視点でNoteを取り直す
				const expected = await Promise.all(notes.reverse().map(s => apiOk({
					endpoint: 'notes/show',
					parameters: { noteId: s.id },
					user: alice,
				})));

				const response = await apiOk({
					endpoint: 'antennas/notes',
					parameters: { antennaId: aliceAntenna.id },
					user: alice,
				});
				assert.deepStrictEqual(
					response.map(({ userId, id, text }) => ({ userId, id, text })),
					expected.map(({ userId, id, text }) => ({ userId, id, text })));
				assert.deepStrictEqual(response, expected);
			});

			test.skip('から取得でき、日付指定のPaginationに一貫性があること', async () => { });
			test.each([
				{ label: 'ID指定', offsetBy: 'id' },

				// BUG sinceDate, untilDateはsinceIdや他のエンドポイントとは異なり、その時刻に一致するレコードを含んでしまう。
				// { label: '日付指定', offsetBy: 'createdAt' },
			] as const)('から取得でき、$labelのPaginationに一貫性があること', async ({ offsetBy }) => {
				const aliceAntenna = await antenna(alice, { keywords: [[keyword]] });
				const notes = await [...Array(30)].reduce(async (prev, current, index) => {
					const p = await prev;
					const n = await post(alice, { text: `${keyword} (${index})` });
					return [n].concat(p);
				}, Promise.resolve([] as Note[]));

				// antennas/notesは降順のみで、昇順をサポートしない。
				await testPaginationConsistency(notes, async (paginationParam) => {
					return apiOk({
						endpoint: 'antennas/notes',
						parameters: { antennaId: aliceAntenna.id, ...paginationParam },
						user: alice,
					}) as any as Note[];
				}, offsetBy, 'desc');
			});

			// BUG 7日過ぎると作り直すしかない。 https://github.com/misskey-dev/misskey/issues/10476
			test.todo('から取得したときアンテナがActiveに戻る');

			//#endregion
		});

		//#region ストリーム(streaming)

		describe('main', () => {
			test('ミュートしているユーザーからメンションされても、ストリームに unreadMention イベントが流れてこない', async () => {
				// 状態リセット
				await api('/i/read-all-unread-notes', {}, alice);

				const fired = await waitFire(alice, 'main', () => post(userMutedByAlice, { text: '@alice hi' }), msg => msg.type === 'unreadMention');

				assert.strictEqual(fired, false);
			});

			test('ストリームにメンションイベントが流れること', async () => {
				const fired = await waitFire(
					kyoko, 'main',	// kyoko:main
					() => post(ayano, { text: 'foo @kyoko bar' }),	// ayano mention => kyoko
					msg => msg.type === 'mention' && msg.body.userId === ayano.id,	// wait ayano
				);

				assert.strictEqual(fired, true);
			});

			test('ストリームにリノートイベントが流れること', async () => {
				const fired = await waitFire(
					kyoko, 'main',	// kyoko:main
					() => post(ayano, { renoteId: kyokoNote.id }),	// ayano renote
					msg => msg.type === 'renote' && msg.body.renoteId === kyokoNote.id,	// wait renote
				);

				assert.strictEqual(fired, true);
			});
		});

		describe('homeTimeline', () => {
			test('自分の投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:Home
					() => api('notes/create', { text: 'foo' }, ayano),	// ayano posts
					msg => msg.type === 'note' && msg.body.text === 'foo',
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしているユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',		// ayano:home
					() => api('notes/create', { text: 'foo' }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしていないユーザーの投稿は流れない', async () => {
				const fired = await waitFire(
					kyoko, 'homeTimeline',	// kyoko:home
					() => api('notes/create', { text: 'foo' }, ayano),	// ayano posts
					msg => msg.type === 'note' && msg.body.userId === ayano.id,	// wait ayano
				);

				assert.strictEqual(fired, false);
			});

			test('フォローしているユーザーのダイレクト投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'foo', visibility: 'specified', visibleUserIds: [ayano.id] }, kyoko),	// kyoko dm => ayano
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしているユーザーでも自分が指定されていないダイレクト投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'foo', visibility: 'specified', visibleUserIds: [chitose.id] }, kyoko),	// kyoko dm => chitose
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});
		});

		describe('localTimeline', () => {
			test('自分の投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'localTimeline',	// ayano:Local
					() => api('notes/create', { text: 'foo' }, ayano),	// ayano posts
					msg => msg.type === 'note' && msg.body.text === 'foo',
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしていないローカルユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'localTimeline',	// ayano:Local
					() => api('notes/create', { text: 'foo' }, chitose),	// chitose posts
					msg => msg.type === 'note' && msg.body.userId === chitose.id,	// wait chitose
				);

				assert.strictEqual(fired, true);
			});

			/* TODO
	test('リモートユーザーの投稿は流れない', async () => {
		const fired = await waitFire(
			ayano, 'localTimeline',	// ayano:Local
			() => api('notes/create', { text: 'foo' }, chinatsu),	// chinatsu posts
			msg => msg.type === 'note' && msg.body.userId === chinatsu.id,	// wait chinatsu
		);
	
		assert.strictEqual(fired, false);
	});
	
	test('フォローしてたとしてもリモートユーザーの投稿は流れない', async () => {
		const fired = await waitFire(
			ayano, 'localTimeline',	// ayano:Local
			() => api('notes/create', { text: 'foo' }, akari),	// akari posts
			msg => msg.type === 'note' && msg.body.userId === akari.id,	// wait akari
		);
	
		assert.strictEqual(fired, false);
	});
	*/

			test('ホーム指定の投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'localTimeline',	// ayano:Local
					() => api('notes/create', { text: 'foo', visibility: 'home' }, kyoko),	// kyoko home posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});

			test('フォローしているローカルユーザーのダイレクト投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'localTimeline',	// ayano:Local
					() => api('notes/create', { text: 'foo', visibility: 'specified', visibleUserIds: [ayano.id] }, kyoko),	// kyoko DM => ayano
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});

			test('フォローしていないローカルユーザーのフォロワー宛て投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'localTimeline',	// ayano:Local
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, chitose),
					msg => msg.type === 'note' && msg.body.userId === chitose.id,	// wait chitose
				);

				assert.strictEqual(fired, false);
			});

			test('ストリームにリノートミュートしているユーザーのリノートが流れない', async () => {
				const bobNote = await post(bob, { text: 'hi' });

				const fired = await waitFire(
					alice, 'localTimeline',
					() => api('notes/create', { renoteId: bobNote.id }, userRnMutedByAlice),
					msg => msg.type === 'note' && msg.body.renoteId === bobNote.id,
				);

				assert.strictEqual(fired, false);
			});

			test('ストリームにリノートミュートしているユーザーの引用が流れる', async () => {
				const bobNote = await post(bob, { text: 'hi' });

				const fired = await waitFire(
					alice, 'localTimeline',
					() => api('notes/create', { renoteId: bobNote.id, text: 'kore' }, userRnMutedByAlice),
					msg => msg.type === 'note' && msg.body.userId === userRnMutedByAlice.id,
				);

				assert.strictEqual(fired, true);
			});
		});

		describe('hybridTimeline', () => {
			test('自分の投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo' }, ayano),	// ayano posts
					msg => msg.type === 'note' && msg.body.text === 'foo',
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしていないローカルユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo' }, chitose),	// chitose posts
					msg => msg.type === 'note' && msg.body.userId === chitose.id,	// wait chitose
				);

				assert.strictEqual(fired, true);
			});

			/* TODO
		test('フォローしているリモートユーザーの投稿が流れる', async () => {
			const fired = await waitFire(
				ayano, 'hybridTimeline',	// ayano:Hybrid
				() => api('notes/create', { text: 'foo' }, akari),	// akari posts
				msg => msg.type === 'note' && msg.body.userId === akari.id,	// wait akari
			);
	
			assert.strictEqual(fired, true);
		});
	
		test('フォローしていないリモートユーザーの投稿は流れない', async () => {
			const fired = await waitFire(
				ayano, 'hybridTimeline',	// ayano:Hybrid
				() => api('notes/create', { text: 'foo' }, chinatsu),	// chinatsu posts
				msg => msg.type === 'note' && msg.body.userId === chinatsu.id,	// wait chinatsu
			);
	
			assert.strictEqual(fired, false);
		});
		*/

			test('フォローしているユーザーのダイレクト投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo', visibility: 'specified', visibleUserIds: [ayano.id] }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしているユーザーのホーム投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo', visibility: 'home' }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしていないローカルユーザーのホーム投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo', visibility: 'home' }, chitose),
					msg => msg.type === 'note' && msg.body.userId === chitose.id,
				);

				assert.strictEqual(fired, false);
			});

			test('フォローしていないローカルユーザーのフォロワー宛て投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, chitose),
					msg => msg.type === 'note' && msg.body.userId === chitose.id,
				);

				assert.strictEqual(fired, false);
			});
		});

		describe('globalTimeline', () => {
			test('フォローしていないローカルユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',	// ayano:Global
					() => api('notes/create', { text: 'foo' }, chitose),	// chitose posts
					msg => msg.type === 'note' && msg.body.userId === chitose.id,	// wait chitose
				);

				assert.strictEqual(fired, true);
			});

			/* TODO
		test('フォローしていないリモートユーザーの投稿が流れる', async () => {
			const fired = await waitFire(
				ayano, 'globalTimeline',	// ayano:Global
				() => api('notes/create', { text: 'foo' }, chinatsu),	// chinatsu posts
				msg => msg.type === 'note' && msg.body.userId === chinatsu.id,	// wait chinatsu
			);
	
			assert.strictEqual(fired, true);
		});
		*/

			test('ホーム投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',	// ayano:Global
					() => api('notes/create', { text: 'foo', visibility: 'home' }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});
		});

		describe('userList', () => {
			test('リストに入れているユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo' }, ayano),
					msg => msg.type === 'note' && msg.body.userId === ayano.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, true);
			});

			test('リストに入れていないユーザーの投稿は流れない', async () => {
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo' }, chinatsu),
					msg => msg.type === 'note' && msg.body.userId === chinatsu.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #4471
			test('リストに入れているユーザーのダイレクト投稿が流れる', async () => {
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo', visibility: 'specified', visibleUserIds: [chitose.id] }, ayano),
					msg => msg.type === 'note' && msg.body.userId === ayano.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, true);
			});

			// #4335
			test('リストに入れているがフォローはしてないユーザーのフォロワー宛て投稿は流れない', async () => {
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});
		});

		// XXX: QueryFailedError: duplicate key value violates unique constraint "IDX_347fec870eafea7b26c8a73bac"
		/*
			describe('hashtag', () => {
				test('指定したハッシュタグの投稿が流れる', () => new Promise<void>(async done => {
					const ws = await connectStream(chitose, 'hashtag', ({ type, body }) => {
						if (type === 'note') {
							assert.deepStrictEqual(body.text, '#foo');
							ws.close();
							done();
						}
					}, {
						q: [
							['foo'],
						],
					});
			
					post(chitose, {
						text: '#foo',
					});
				}));
			
				test('指定したハッシュタグの投稿が流れる (AND)', () => new Promise<void>(async done => {
					let fooCount = 0;
					let barCount = 0;
					let fooBarCount = 0;
			
					const ws = await connectStream(chitose, 'hashtag', ({ type, body }) => {
						if (type === 'note') {
							if (body.text === '#foo') fooCount++;
							if (body.text === '#bar') barCount++;
							if (body.text === '#foo #bar') fooBarCount++;
						}
					}, {
						q: [
							['foo', 'bar'],
						],
					});
			
					post(chitose, {
						text: '#foo',
					});
			
					post(chitose, {
						text: '#bar',
					});
			
					post(chitose, {
						text: '#foo #bar',
					});
			
					setTimeout(() => {
						assert.strictEqual(fooCount, 0);
						assert.strictEqual(barCount, 0);
						assert.strictEqual(fooBarCount, 1);
						ws.close();
						done();
					}, 3000);
				}));
			
				test('指定したハッシュタグの投稿が流れる (OR)', () => new Promise<void>(async done => {
					let fooCount = 0;
					let barCount = 0;
					let fooBarCount = 0;
					let piyoCount = 0;
			
					const ws = await connectStream(chitose, 'hashtag', ({ type, body }) => {
						if (type === 'note') {
							if (body.text === '#foo') fooCount++;
							if (body.text === '#bar') barCount++;
							if (body.text === '#foo #bar') fooBarCount++;
							if (body.text === '#piyo') piyoCount++;
						}
					}, {
						q: [
							['foo'],
							['bar'],
						],
					});
			
					post(chitose, {
						text: '#foo',
					});
			
					post(chitose, {
						text: '#bar',
					});
			
					post(chitose, {
						text: '#foo #bar',
					});
			
					post(chitose, {
						text: '#piyo',
					});
			
					setTimeout(() => {
						assert.strictEqual(fooCount, 1);
						assert.strictEqual(barCount, 1);
						assert.strictEqual(fooBarCount, 1);
						assert.strictEqual(piyoCount, 0);
						ws.close();
						done();
					}, 3000);
				}));
			
				test('指定したハッシュタグの投稿が流れる (AND + OR)', () => new Promise<void>(async done => {
					let fooCount = 0;
					let barCount = 0;
					let fooBarCount = 0;
					let piyoCount = 0;
					let waaaCount = 0;
			
					const ws = await connectStream(chitose, 'hashtag', ({ type, body }) => {
						if (type === 'note') {
							if (body.text === '#foo') fooCount++;
							if (body.text === '#bar') barCount++;
							if (body.text === '#foo #bar') fooBarCount++;
							if (body.text === '#piyo') piyoCount++;
							if (body.text === '#waaa') waaaCount++;
						}
					}, {
						q: [
							['foo', 'bar'],
							['piyo'],
						],
					});
			
					post(chitose, {
						text: '#foo',
					});
			
					post(chitose, {
						text: '#bar',
					});
			
					post(chitose, {
						text: '#foo #bar',
					});
			
					post(chitose, {
						text: '#piyo',
					});
			
					post(chitose, {
						text: '#waaa',
					});
			
					setTimeout(() => {
						assert.strictEqual(fooCount, 0);
						assert.strictEqual(barCount, 0);
						assert.strictEqual(fooBarCount, 1);
						assert.strictEqual(piyoCount, 1);
						assert.strictEqual(waaaCount, 0);
						ws.close();
						done();
					}, 3000);
				}));
			});
			*/
		//#endregion
	});

	describe('通知', () => {
		//#region 通知(i/notifications)

		test('通知にミュートしているユーザーの通知が含まれない(リアクション)', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			await react(bob, aliceNote, 'like');
			await react(userMutedByAlice, aliceNote, 'like');

			const res = await api('/i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === bob.id), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === userMutedByAlice.id), false);
		});

		test('i/notifications にミュートしているスレッドの通知が含まれない', async () => {
			const bobNote = await post(bob, { text: '@alice @carol root note' });
			const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

			await api('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

			const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
			const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });

			const res = await api('/i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((notification: any) => notification.note?.id === carolReply.id), false);
			assert.strictEqual(res.body.some((notification: any) => notification.note?.id === carolReplyWithoutMention.id), false);

			// NOTE: bobの投稿はスレッドミュート前に行われたため通知に含まれていてもよい
		});

		//#endregion
		//#region ストリーム(streaming)

		test('ミュートしているユーザーからメンションされても、ストリームに unreadNotification イベントが流れてこない', async () => {
			// 状態リセット
			await api('/i/read-all-unread-notes', {}, alice);
			await api('/notifications/mark-all-as-read', {}, alice);

			const fired = await waitFire(alice, 'main', () => post(userMutedByAlice, { text: '@alice hi' }), msg => msg.type === 'unreadNotification');

			assert.strictEqual(fired, false);
		});

		test('ミュートしているスレッドからメンションされても、ストリームに unreadMention イベントが流れてこない', () => new Promise<void>(async done => {
			// 状態リセット
			await api('/i/read-all-unread-notes', {}, alice);

			const bobNote = await post(bob, { text: '@alice @carol root note' });

			await api('/notes/thread-muting/create', { noteId: bobNote.id }, alice);

			let fired = false;

			const ws = await connectStream(alice, 'main', async ({ type, body }) => {
				if (type === 'unreadMention') {
					if (body === bobNote.id) return;
					fired = true;
				}
			});

			const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));

		//#endregion
	});

	describe('リノートミュート', () => {
		afterAll(async () => {
			await api('/renote-mute/delete', {
				userId: carol.id,
			}, alice);
		});

		test('ミュート作成', async () => {
			const res = await api('/renote-mute/create', {
				userId: carol.id,
			}, alice);

			assert.strictEqual(res.status, 204);
		});
	});

	describe('ユーザー', () => {
		// エンティティとしてのユーザーを主眼においたテストを記述する
		// (Userを返すエンドポイントとUserエンティティを書き換えるエンドポイントをテストする)

		const stripUndefined = <T extends { [key: string]: any },>(orig: T): Partial<T> => {
			return Object.entries({ ...orig })
				.filter(([, value]) => value !== undefined)
				.reduce((obj: Partial<T>, [key, value]) => {
					obj[key as keyof T] = value;
					return obj;
				}, {});
		};

		// BUG misskey-jsとjson-schemaと実際に返ってくるデータが全部違う
		type UserLite = misskey.entities.UserLite & {
			badgeRoles: any[],
		};

		type UserDetailedNotMe = UserLite &
			misskey.entities.UserDetailed & {
				roles: any[],
			};

		type MeDetailed = UserDetailedNotMe &
			misskey.entities.MeDetailed & {
				achievements: object[],
				loggedInDays: number,
				policies: object,
			};

		const show = async (id: string, me = root): Promise<MeDetailed | UserDetailedNotMe> => {
			return apiOk({ endpoint: 'users/show', parameters: { userId: id }, user: me }) as any;
		};

		// UserLiteのキーが過不足なく入っている？
		const userLite = (user: User): Partial<UserLite> => {
			return stripUndefined({
				id: user.id,
				name: user.name,
				username: user.username,
				host: user.host,
				avatarUrl: user.avatarUrl,
				avatarBlurhash: user.avatarBlurhash,
				isBot: user.isBot,
				isCat: user.isCat,
				instance: user.instance,
				emojis: user.emojis,
				onlineStatus: user.onlineStatus,
				badgeRoles: user.badgeRoles,

				// BUG isAdmin/isModeratorはUserLiteではなくMeDetailedOnlyに含まれる。
				isAdmin: undefined,
				isModerator: undefined,
			});
		};

		// UserDetailedNotMeのキーが過不足なく入っている？
		const userDetailedNotMe = (user: User): Partial<UserDetailedNotMe> => {
			return stripUndefined({
				...userLite(user),
				url: user.url,
				uri: user.uri,
				movedTo: user.movedTo,
				alsoKnownAs: user.alsoKnownAs,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				lastFetchedAt: user.lastFetchedAt,
				bannerUrl: user.bannerUrl,
				bannerBlurhash: user.bannerBlurhash,
				isLocked: user.isLocked,
				isSilenced: user.isSilenced,
				isSuspended: user.isSuspended,
				description: user.description,
				location: user.location,
				birthday: user.birthday,
				lang: user.lang,
				fields: user.fields,
				followersCount: user.followersCount,
				followingCount: user.followingCount,
				notesCount: user.notesCount,
				pinnedNoteIds: user.pinnedNoteIds,
				pinnedNotes: user.pinnedNotes,
				pinnedPageId: user.pinnedPageId,
				pinnedPage: user.pinnedPage,
				publicReactions: user.publicReactions,
				ffVisibility: user.ffVisibility,
				twoFactorEnabled: user.twoFactorEnabled,
				usePasswordLessLogin: user.usePasswordLessLogin,
				securityKeys: user.securityKeys,
				roles: user.roles,
				memo: user.memo,
			});
		};

		// Relations関連のキーが過不足なく入っている？
		const userDetailedNotMeWithRelations = (user: User): Partial<UserDetailedNotMe> => {
			return stripUndefined({
				...userDetailedNotMe(user),
				isFollowing: user.isFollowing ?? false,
				isFollowed: user.isFollowed ?? false,
				hasPendingFollowRequestFromYou: user.hasPendingFollowRequestFromYou ?? false,
				hasPendingFollowRequestToYou: user.hasPendingFollowRequestToYou ?? false,
				isBlocking: user.isBlocking ?? false,
				isBlocked: user.isBlocked ?? false,
				isMuted: user.isMuted ?? false,
				isRenoteMuted: user.isRenoteMuted ?? false,
			});
		};

		// MeDetailedのキーが過不足なく入っている？
		const meDetailed = (user: User, security = false, admin = false): Partial<MeDetailed> => {
			return stripUndefined({
				...userDetailedNotMe(user),
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				isModerator: user.isModerator,
				isAdmin: user.isAdmin,
				injectFeaturedNote: user.injectFeaturedNote,
				receiveAnnouncementEmail: user.receiveAnnouncementEmail,
				alwaysMarkNsfw: user.alwaysMarkNsfw,
				autoSensitive: user.autoSensitive,
				carefulBot: user.carefulBot,
				autoAcceptFollowed: user.autoAcceptFollowed,
				noCrawle: user.noCrawle,
				preventAiLearning: user.preventAiLearning,
				isExplorable: user.isExplorable,
				isDeleted: user.isDeleted,
				hideOnlineStatus: user.hideOnlineStatus,
				hasUnreadSpecifiedNotes: user.hasUnreadSpecifiedNotes,
				hasUnreadMentions: user.hasUnreadMentions,
				hasUnreadAnnouncement: user.hasUnreadAnnouncement,
				hasUnreadAntenna: user.hasUnreadAntenna,
				hasUnreadChannel: user.hasUnreadChannel,
				hasUnreadNotification: user.hasUnreadNotification,
				hasPendingReceivedFollowRequest: user.hasPendingReceivedFollowRequest,
				mutedWords: user.mutedWords,
				mutedInstances: user.mutedInstances,
				mutingNotificationTypes: user.mutingNotificationTypes,
				emailNotificationTypes: user.emailNotificationTypes,
				achievements: user.achievements,
				loggedInDays: user.loggedInDays,
				policies: user.policies,
				...(security ? {
					email: user.email,
					emailVerified: user.emailVerified,
					securityKeysList: user.securityKeysList,
				} : {}),
				...(admin ? {
					moderationNote: user.moderationNote,
				} : {}),
			});
		};

		//#region サインアップ(signup)

		test('が作れる。（作りたての状態で自分のユーザー情報が取れる）', async () => {
			// SignupApiService.ts
			const response = await apiOk({
				endpoint: 'signup',
				parameters: { username: 'zoe', password: 'password' },
				user: undefined,
			}) as unknown as User; // BUG MeDetailedに足りないキーがある

			// signupの時はtokenが含まれる特別なMeDetailedが返ってくる
			assert.match(response.token, /[a-zA-Z0-9]{16}/);
			assert.match(response.id, /[0-9a-z]{10}/);
			assert.match(response.avatarUrl, /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
			const expected = {
				token: response.token,

				// UserLite
				id: response.id,
				name: null,
				username: 'zoe',
				host: null,
				avatarUrl: response.avatarUrl,
				avatarBlurhash: null,
				isBot: false,
				isCat: false,
				emojis: {},
				onlineStatus: 'unknown',
				badgeRoles: [],

				// UserDetailedNotMeOnly
				url: null,
				uri: null,
				movedTo: null,
				alsoKnownAs: null,
				createdAt: new Date(response.createdAt).toISOString(),
				updatedAt: null,
				lastFetchedAt: null,
				bannerUrl: null,
				bannerBlurhash: null,
				isLocked: false,
				isSilenced: false,
				isSuspended: false,
				description: null,
				location: null,
				birthday: null,
				lang: null,
				fields: [],
				followersCount: 0,
				followingCount: 0,
				notesCount: 0,
				pinnedNoteIds: [],
				pinnedNotes: [],
				pinnedPageId: null,
				pinnedPage: null,
				publicReactions: true,
				ffVisibility: 'public',
				twoFactorEnabled: false,
				usePasswordLessLogin: false,
				securityKeys: false,
				roles: [],
				memo: null,

				// MeDetailedOnly
				avatarId: null,
				bannerId: null,
				isModerator: false,
				isAdmin: false,
				injectFeaturedNote: true,
				receiveAnnouncementEmail: true,
				alwaysMarkNsfw: false,
				autoSensitive: false,
				carefulBot: false,
				autoAcceptFollowed: true,
				noCrawle: false,
				preventAiLearning: true,
				isExplorable: true,
				isDeleted: false,
				hideOnlineStatus: false,
				hasUnreadSpecifiedNotes: false,
				hasUnreadMentions: false,
				hasUnreadAnnouncement: false,
				hasUnreadAntenna: false,
				hasUnreadChannel: false,
				hasUnreadNotification: false,
				hasPendingReceivedFollowRequest: false,
				mutedWords: [],
				mutedInstances: [],
				mutingNotificationTypes: [],
				emailNotificationTypes: ['follow', 'receiveFollowRequest'],
				achievements: [],
				loggedInDays: 0,
				policies: DEFAULT_POLICIES,
				email: null,
				emailVerified: false,
				securityKeysList: [],
			};
			assert.deepStrictEqual(response, expected);
		});

		test('は不正なユーザー名だと作成できない', async () => {
			const res = await api('signup', {
				username: 'test.',
				password: 'test',
			});
			assert.strictEqual(res.status, 400);
		});

		test('は空のパスワードだと作成できない', async () => {
			const res = await api('signup', {
				username: 'test',
				password: '',
			});
			assert.strictEqual(res.status, 400);
		});

		test('を正しく作成できる', async () => {
			const me = {
				username: 'test1',
				password: 'test1',
			};

			const res = await api('signup', me);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.username, me.username);
		});

		test('は同じユーザー名のアカウントは作成できない', async () => {
			const res = await api('signup', {
				username: 'test1',
				password: 'test1',
			});

			assert.strictEqual(res.status, 400);
		});

		//#endregion
		//#region サインイン(signin)

		test('は間違ったパスワードでサインインできない', async () => {
			const res = await api('signin', {
				username: 'test1',
				password: 'bar',
			});

			assert.strictEqual(res.status, 403);
		});

		test('のサインイン時にクエリをインジェクションできない', async () => {
			const res = await api('signin', {
				username: 'test1',
				password: {
					$gt: '',
				},
			});

			assert.strictEqual(res.status, 400);
		});

		test('は正しい情報でサインインできる', async () => {
			const res = await api('signin', {
				username: 'test1',
				password: 'test1',
			});

			assert.strictEqual(res.status, 200);
		});

		//#endregion
		//#region 自分の情報(i)

		test('を読み取ることができること（自分）、キーが過不足なく入っていること。', async () => {
			const response = await apiOk({
				endpoint: 'i',
				parameters: {},
				user: userNoNote,
			});
			const expected = meDetailed(userNoNote, true);
			expected.loggedInDays = 1; // iはloggedInDaysを更新する
			assert.deepStrictEqual(response, expected);
		});

		test('ミュートしているユーザーからメンションされても、hasUnreadMentions が true にならない', async () => {
			// 状態リセット
			await api('/i/read-all-unread-notes', {}, userMutedByAlice);
			await post(carol, { text: '@alice hi' });
			const res = await api('/i', {}, userMutedByAlice);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.hasUnreadMentions, false);
		});

		test('ミュートしているスレッドからメンションされても、hasUnreadMentions が true にならない', async () => {
			// 状態リセット
			await api('/i/read-all-unread-notes', {}, alice);
			const bobNote = await post(bob, { text: '@alice @carol root note' });
			await api('/notes/thread-muting/create', { noteId: bobNote.id }, alice);
			const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
			const res = await api('/i', {}, alice);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.hasUnreadMentions, false);
		});

		//#endregion
		//#region 自分の情報の更新(i/update)

		test('アカウント設定を更新できる', async () => {
			const myName = '大室櫻子';
			const myLocation = '七森中';
			const myBirthday = '2000-09-07';

			const res = await api('/i/update', {
				name: myName,
				location: myLocation,
				birthday: myBirthday,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, myName);
			assert.strictEqual(res.body.location, myLocation);
			assert.strictEqual(res.body.birthday, myBirthday);
		});

		test('の名前を空白にできる', async () => {
			const res = await api('/i/update', {
				name: ' ',
			}, alice);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.name, ' ');
		});

		test('の誕生日の設定を削除できる', async () => {
			await api('/i/update', {
				birthday: '2000-09-07',
			}, alice);

			const res = await api('/i/update', {
				birthday: null,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.birthday, null);
		});

		test('の更新は不正な誕生日の形式だと怒られる', async () => {
			const res = await api('/i/update', {
				birthday: '2000/09/07',
			}, alice);
			assert.strictEqual(res.status, 400);
		});

		test.each([
			{ parameters: (): object => ({ name: null }) },
			{ parameters: (): object => ({ name: 'x'.repeat(50) }) },
			{ parameters: (): object => ({ name: 'x' }) },
			{ parameters: (): object => ({ name: 'My name' }) },
			{ parameters: (): object => ({ description: null }) },
			{ parameters: (): object => ({ description: 'x'.repeat(1500) }) },
			{ parameters: (): object => ({ description: 'x' }) },
			{ parameters: (): object => ({ description: 'My description' }) },
			{ parameters: (): object => ({ location: null }) },
			{ parameters: (): object => ({ location: 'x'.repeat(50) }) },
			{ parameters: (): object => ({ location: 'x' }) },
			{ parameters: (): object => ({ location: 'My location' }) },
			{ parameters: (): object => ({ birthday: '0000-00-00' }) },
			{ parameters: (): object => ({ birthday: '9999-99-99' }) },
			{ parameters: (): object => ({ lang: 'en-US' }) },
			{ parameters: (): object => ({ fields: [] }) },
			{ parameters: (): object => ({ fields: [{ name: 'x', value: 'x' }] }) },
			{ parameters: (): object => ({ fields: [{ name: 'x'.repeat(3000), value: 'x'.repeat(3000) }] }) }, // BUG? fieldには制限がない
			{ parameters: (): object => ({ fields: Array(16).fill({ name: 'x', value: 'y' }) }) },
			{ parameters: (): object => ({ isLocked: true }) },
			{ parameters: (): object => ({ isLocked: false }) },
			{ parameters: (): object => ({ isExplorable: false }) },
			{ parameters: (): object => ({ isExplorable: true }) },
			{ parameters: (): object => ({ hideOnlineStatus: true }), changes: { 'onlineStatus': 'unknown' } },
			{ parameters: (): object => ({ hideOnlineStatus: false }), changes: { 'onlineStatus': 'online' } },
			{ parameters: (): object => ({ publicReactions: false }) },
			{ parameters: (): object => ({ publicReactions: true }) },
			{ parameters: (): object => ({ autoAcceptFollowed: true }) },
			{ parameters: (): object => ({ autoAcceptFollowed: false }) },
			{ parameters: (): object => ({ noCrawle: true }) },
			{ parameters: (): object => ({ noCrawle: false }) },
			{ parameters: (): object => ({ preventAiLearning: false }) },
			{ parameters: (): object => ({ preventAiLearning: true }) },
			{ parameters: (): object => ({ isBot: true }) },
			{ parameters: (): object => ({ isBot: false }) },
			{ parameters: (): object => ({ isCat: true }) },
			{ parameters: (): object => ({ isCat: false }) },
			{ parameters: (): object => ({ injectFeaturedNote: true }) },
			{ parameters: (): object => ({ injectFeaturedNote: false }) },
			{ parameters: (): object => ({ receiveAnnouncementEmail: true }) },
			{ parameters: (): object => ({ receiveAnnouncementEmail: false }) },
			{ parameters: (): object => ({ alwaysMarkNsfw: true }) },
			{ parameters: (): object => ({ alwaysMarkNsfw: false }) },
			{ parameters: (): object => ({ autoSensitive: true }) },
			{ parameters: (): object => ({ autoSensitive: false }) },
			{ parameters: (): object => ({ ffVisibility: 'private' }) },
			{ parameters: (): object => ({ ffVisibility: 'followers' }) },
			{ parameters: (): object => ({ ffVisibility: 'public' }) },
			{ parameters: (): object => ({ mutedWords: Array(19).fill(['xxxxx']) }) },
			{ parameters: (): object => ({ mutedWords: [['x'.repeat(194)]] }) },
			{ parameters: (): object => ({ mutedWords: [] }) },
			{ parameters: (): object => ({ mutedInstances: ['xxxx.xxxxx'] }) },
			{ parameters: (): object => ({ mutedInstances: [] }) },
			{ parameters: (): object => ({ mutingNotificationTypes: ['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app'] }) },
			{ parameters: (): object => ({ mutingNotificationTypes: [] }) },
			{ parameters: (): object => ({ emailNotificationTypes: ['mention', 'reply', 'quote', 'follow', 'receiveFollowRequest'] }) },
			{ parameters: (): object => ({ emailNotificationTypes: [] }) },
		] as const)('を書き換えることができる($#)', async ({ parameters, changes }) => {
			const response = await apiOk({ endpoint: 'i/update', parameters: parameters(), user: alice });
			const expected = { ...meDetailed(alice, true, true), ...parameters(), ...(changes ?? {}) };
			assert.deepStrictEqual(response, expected, inspect(parameters()));
		});

		test('を書き換えることができる(Avatar)', async () => {
			const aliceFile = (await uploadFile(alice)).body;
			const parameters = { avatarId: aliceFile.id };
			const response = await apiOk({ endpoint: 'i/update', parameters: parameters, user: alice });
			assert.match(response.avatarUrl ?? '.', /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
			assert.match(response.avatarBlurhash ?? '.', /[ -~]{54}/);
			const expected = {
				...meDetailed(alice, true),
				avatarId: aliceFile.id,
				avatarBlurhash: response.avatarBlurhash,
				avatarUrl: response.avatarUrl,
			};
			assert.deepStrictEqual(response, expected, inspect(parameters));

			const parameters2 = { avatarId: null };
			const response2 = await apiOk({ endpoint: 'i/update', parameters: parameters2, user: alice });
			const expected2 = {
				...meDetailed(alice, true),
				avatarId: null,
				avatarBlurhash: null,
				avatarUrl: alice.avatarUrl, // 解除した場合、identiconになる
			};
			assert.deepStrictEqual(response2, expected2, inspect(parameters));
		});

		test('を書き換えることができる(Banner)', async () => {
			const aliceFile = (await uploadFile(alice)).body;
			const parameters = { bannerId: aliceFile.id };
			const response = await apiOk({ endpoint: 'i/update', parameters: parameters, user: alice });
			assert.match(response.bannerUrl ?? '.', /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
			assert.match(response.bannerBlurhash ?? '.', /[ -~]{54}/);
			const expected = {
				...meDetailed(alice, true),
				bannerId: aliceFile.id,
				bannerBlurhash: response.bannerBlurhash,
				bannerUrl: response.bannerUrl,
			};
			assert.deepStrictEqual(response, expected, inspect(parameters));

			const parameters2 = { bannerId: null };
			const response2 = await apiOk({ endpoint: 'i/update', parameters: parameters2, user: alice });
			const expected2 = {
				...meDetailed(alice, true),
				bannerId: null,
				bannerBlurhash: null,
				bannerUrl: null,
			};
			assert.deepStrictEqual(response2, expected2, inspect(parameters));
		});

		//#endregion
		//#region 自分の情報の更新(i/pin, i/unpin)

		test('を書き換えることができる(ピン止めノート)', async () => {
			const parameters = { noteId: aliceNote.id };
			const response = await apiOk({ endpoint: 'i/pin', parameters, user: alice });
			const expected = { ...meDetailed(alice, false), pinnedNoteIds: [aliceNote.id], pinnedNotes: [aliceNote] };
			assert.deepStrictEqual(response, expected);

			const response2 = await apiOk({ endpoint: 'i/unpin', parameters, user: alice });
			const expected2 = meDetailed(alice, false);
			assert.deepStrictEqual(response2, expected2);
		});

		//#endregion
		//#region メモの更新(users/update-memo)

		test('のメモを更新できる', async () => {
			const memo = '10月まで低浮上とのこと。';

			const res1 = await api('/users/update-memo', {
				memo,
				userId: bob.id,
			}, alice);

			const res2 = await api('/users/show', {
				userId: bob.id,
			}, alice);
			assert.strictEqual(res1.status, 204);
			assert.strictEqual(res2.body?.memo, memo);
		});

		test('(自分)のメモを更新できる', async () => {
			const memo = 'チケットを月末までに買う。';

			const res1 = await api('/users/update-memo', {
				memo,
				userId: alice.id,
			}, alice);

			const res2 = await api('/users/show', {
				userId: alice.id,
			}, alice);
			assert.strictEqual(res1.status, 204);
			assert.strictEqual(res2.body?.memo, memo);
		});

		test('のメモを削除できる', async () => {
			const memo = '10月まで低浮上とのこと。';

			await api('/users/update-memo', {
				memo,
				userId: bob.id,
			}, alice);

			await api('/users/update-memo', {
				memo: '',
				userId: bob.id,
			}, alice);

			const res = await api('/users/show', {
				userId: bob.id,
			}, alice);

			// memoには常に文字列かnullが入っている(5cac151)
			assert.strictEqual(res.body.memo, null);
		});

		test('のメモは個人ごとに独立して保存される', async () => {
			const memoAliceToBob = '10月まで低浮上とのこと。';
			const memoCarolToBob = '例の件について今度問いただす。';

			await Promise.all([
				api('/users/update-memo', {
					memo: memoAliceToBob,
					userId: bob.id,
				}, alice),
				api('/users/update-memo', {
					memo: memoCarolToBob,
					userId: bob.id,
				}, carol),
			]);

			const [resAlice, resCarol] = await Promise.all([
				api('/users/show', {
					userId: bob.id,
				}, alice),
				api('/users/show', {
					userId: bob.id,
				}, carol),
			]);

			assert.strictEqual(resAlice.body.memo, memoAliceToBob);
			assert.strictEqual(resCarol.body.memo, memoCarolToBob);
		});

		test.each([
			{ label: '最大長', memo: 'x'.repeat(2048) },
			{ label: '空文字', memo: '', expects: null },
			{ label: 'null', memo: null },
		])('を書き換えることができる(メモを$labelに)', async ({ memo, expects }) => {
			const expected = { ...await show(bob.id, alice), memo: expects === undefined ? memo : expects };
			const parameters = { userId: bob.id, memo };
			await apiOk({ endpoint: 'users/update-memo', parameters, user: alice });
			const response = await show(bob.id, alice);
			assert.deepStrictEqual(response, expected);
		});

		//#endregion
		//#region ユーザー(users)

		test.each([
			{ label: 'ID昇順', parameters: { limit: 5 }, selector: (u: UserLite): string => u.id },
			{ label: 'フォロワー昇順', parameters: { sort: '+follower' }, selector: (u: UserDetailedNotMe): string => String(u.followersCount) },
			{ label: 'フォロワー降順', parameters: { sort: '-follower' }, selector: (u: UserDetailedNotMe): string => String(u.followersCount) },
			{ label: '登録日時昇順', parameters: { sort: '+createdAt' }, selector: (u: UserDetailedNotMe): string => u.createdAt },
			{ label: '登録日時降順', parameters: { sort: '-createdAt' }, selector: (u: UserDetailedNotMe): string => u.createdAt },
			{ label: '投稿日時昇順', parameters: { sort: '+updatedAt' }, selector: (u: UserDetailedNotMe): string => String(u.updatedAt) },
			{ label: '投稿日時降順', parameters: { sort: '-updatedAt' }, selector: (u: UserDetailedNotMe): string => String(u.updatedAt) },
		] as const)('をリスト形式で取得することができる（$label）', async ({ parameters, selector }) => {
			const response = await apiOk({ endpoint: 'users', parameters, user: alice });

			// 結果の並びを事前にアサートするのは困難なので返ってきたidに対応するユーザーが返っており、ソート順が正しいことだけを検証する
			const users = await Promise.all(response.map(u => show(u.id, alice)));
			const expected = users.sort((x, y) => {
				const index = (selector(x) < selector(y)) ? -1 : (selector(x) > selector(y)) ? 1 : 0;
				return index * (parameters.sort?.startsWith('+') ? -1 : 1);
			});
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれない', user: (): User => userNotExplorable, excluded: true },
			{ label: 'ミュートユーザーが含まれない', user: (): User => userMutedByAlice, excluded: true },
			{ label: 'ブロックされているユーザーが含まれない', user: (): User => userBlockedByAlice, excluded: true },
			{ label: 'ブロックしてきているユーザーが含まれる', user: (): User => userBlockingAlice, excluded: true },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			{ label: 'サスペンドユーザーが含まれない', user: (): User => userSuspended, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('をリスト形式で取得することができ、結果に$label', async ({ user, excluded }) => {
			const parameters = { limit: 100 };
			const response = await apiOk({ endpoint: 'users', parameters, user: alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
			assert.deepStrictEqual(response.filter((u) => u.id === user().id), expected);
		});
		test.todo('をリスト形式で取得することができる（リモート, hostname指定）');
		test.todo('をリスト形式で取得することができる（pagenation）');

		//#endregion
		//#region ユーザー情報(users/show)

		test('が取得できる', async () => {
			const res = await api('/users/show', {
				userId: alice.id,
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.id, alice.id);
		});

		test('の取得はユーザーが存在しなかったら怒る', async () => {
			const res = await api('/users/show', {
				userId: '000000000000000000000000',
			});
			assert.strictEqual(res.status, 404);
		});

		test('の取得は間違ったIDだと怒られる', async () => {
			const res = await api('/users/show', {
				userId: 'kyoppie',
			});
			assert.strictEqual(res.status, 404);
		});

		test.each([
			{ label: 'ID指定で自分自身を', parameters: (): object => ({ userId: alice.id }), user: (): User => alice, type: meDetailed },
			{ label: 'ID指定で他人を', parameters: (): object => ({ userId: alice.id }), user: (): User => carol, type: userDetailedNotMeWithRelations },
			{ label: 'ID指定かつ未認証', parameters: (): object => ({ userId: alice.id }), user: undefined, type: userDetailedNotMe },
			{ label: '@指定で自分自身を', parameters: (): object => ({ username: alice.username }), user: (): User => alice, type: meDetailed },
			{ label: '@指定で他人を', parameters: (): object => ({ username: alice.username }), user: (): User => carol, type: userDetailedNotMeWithRelations },
			{ label: '@指定かつ未認証', parameters: (): object => ({ username: alice.username }), user: undefined, type: userDetailedNotMe },
		] as const)('を取得することができる（$label）', async ({ parameters, user, type }) => {
			const response = await apiOk({ endpoint: 'users/show', parameters: parameters(), user: user?.() });
			const expected = {
				...type(alice),
				memo: response.memo, // memoはどのユーザーからリクエストするかによって取れる値が変わる
			};
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: 'Administratorになっている', user: (): User => userAdmin, me: (): User => userAdmin, selector: (user: User): unknown => user.isAdmin },
			{ label: '自分以外から見たときはAdministratorか判定できない', user: (): User => userAdmin, selector: (user: User): unknown => user.isAdmin, expected: (): undefined => undefined },
			{ label: 'Moderatorになっている', user: (): User => userModerator, me: (): User => userModerator, selector: (user: User): unknown => user.isModerator },
			{ label: '自分以外から見たときはModeratorか判定できない', user: (): User => userModerator, selector: (user: User): unknown => user.isModerator, expected: (): undefined => undefined },
			{ label: 'サイレンスになっている', user: (): User => userSilenced, selector: (user: User): unknown => user.isSilenced },
			//{ label: 'サスペンドになっている', user: (): User => userSuspended, selector: (user: User): unknown => user.isSuspended },
			{ label: '削除済みになっている', user: (): User => userDeletedBySelf, me: (): User => userDeletedBySelf, selector: (user: User): unknown => user.isDeleted },
			{ label: '自分以外から見たときは削除済みか判定できない', user: (): User => userDeletedBySelf, selector: (user: User): unknown => user.isDeleted, expected: (): undefined => undefined },
			{ label: '削除済み(byAdmin)になっている', user: (): User => userDeletedByAdmin, me: (): User => userDeletedByAdmin, selector: (user: User): unknown => user.isDeleted },
			{ label: '自分以外から見たときは削除済み(byAdmin)か判定できない', user: (): User => userDeletedByAdmin, selector: (user: User): unknown => user.isDeleted, expected: (): undefined => undefined },
			{ label: 'フォロー中になっている', user: (): User => userFollowedByAlice, selector: (user: User): unknown => user.isFollowing },
			{ label: 'フォローされている', user: (): User => userFollowingAlice, selector: (user: User): unknown => user.isFollowed },
			{ label: 'ブロック中になっている', user: (): User => userBlockedByAlice, selector: (user: User): unknown => user.isBlocking },
			{ label: 'ブロックされている', user: (): User => userBlockingAlice, selector: (user: User): unknown => user.isBlocked },
			{ label: 'ミュート中になっている', user: (): User => userMutedByAlice, selector: (user: User): unknown => user.isMuted },
			{ label: 'リノートミュート中になっている', user: (): User => userRnMutedByAlice, selector: (user: User): unknown => user.isRenoteMuted },
			{ label: 'フォローリクエスト中になっている', user: (): User => userFollowRequested, me: (): User => userFollowRequesting, selector: (user: User): unknown => user.hasPendingFollowRequestFromYou },
			{ label: 'フォローリクエストされている', user: (): User => userFollowRequesting, me: (): User => userFollowRequested, selector: (user: User): unknown => user.hasPendingFollowRequestToYou },
		] as const)('を取得することができ、$labelこと', async ({ user, me, selector, expected }) => {
			const response = await apiOk({ endpoint: 'users/show', parameters: { userId: user().id }, user: me?.() ?? alice });
			assert.strictEqual(selector(response), (expected ?? ((): true => true))());
		});
		test('を取得することができ、Publicなロールがセットされていること', async () => {
			const response = await apiOk({ endpoint: 'users/show', parameters: { userId: userRolePublic.id }, user: alice });
			assert.deepStrictEqual(response.badgeRoles, []);
			assert.deepStrictEqual(response.roles, [{
				id: rolePublic.id,
				name: rolePublic.name,
				color: rolePublic.color,
				iconUrl: rolePublic.iconUrl,
				description: rolePublic.description,
				isModerator: rolePublic.isModerator,
				isAdministrator: rolePublic.isAdministrator,
				displayOrder: rolePublic.displayOrder,
			}]);
		});
		test('を取得することができ、バッヂロールがセットされていること', async () => {
			const response = await apiOk({ endpoint: 'users/show', parameters: { userId: userRoleBadge.id }, user: alice });
			assert.deepStrictEqual(response.badgeRoles, [{
				name: roleBadge.name,
				iconUrl: roleBadge.iconUrl,
				displayOrder: roleBadge.displayOrder,
			}]);
			assert.deepStrictEqual(response.roles, []); // バッヂだからといってrolesが取れるとは限らない
		});
		test('をID指定のリスト形式で取得することができる（空）', async () => {
			const parameters = { userIds: [] };
			const response = await apiOk({ endpoint: 'users/show', parameters, user: alice });
			const expected: [] = [];
			assert.deepStrictEqual(response, expected);
		});
		test('をID指定のリスト形式で取得することができる', async () => {
			const parameters = { userIds: [bob.id, alice.id, carol.id] };
			const response = await apiOk({ endpoint: 'users/show', parameters, user: alice });
			const expected = [
				await apiOk({ endpoint: 'users/show', parameters: { userId: bob.id }, user: alice }),
				await apiOk({ endpoint: 'users/show', parameters: { userId: alice.id }, user: alice }),
				await apiOk({ endpoint: 'users/show', parameters: { userId: carol.id }, user: alice }),
			];
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: (): User => userNotExplorable },
			{ label: 'ミュートユーザーが含まれる', user: (): User => userMutedByAlice },
			{ label: 'ブロックされているユーザーが含まれる', user: (): User => userBlockedByAlice },
			{ label: 'ブロックしてきているユーザーが含まれる', user: (): User => userBlockingAlice },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			{ label: 'サスペンドユーザーが（モデレーターが見るときは）含まれる', user: (): User => userSuspended, me: (): User => root },
			// BUG サスペンドユーザーを一般ユーザーから見るとrootユーザーが返ってくる
			//{ label: 'サスペンドユーザーが（一般ユーザーが見るときは）含まれない', user: (): User => userSuspended, me: (): User => bob, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('をID指定のリスト形式で取得することができ、結果に$label', async ({ user, me, excluded }) => {
			const parameters = { userIds: [user().id] };
			const response = await apiOk({ endpoint: 'users/show', parameters, user: me?.() ?? alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, me?.() ?? alice)];
			assert.deepStrictEqual(response, expected);
		});
		test.todo('をID指定のリスト形式で取得することができる(リモート)');

		//#endregion
		//#region 検索(users/search)

		test('を検索することができる', async () => {
			const parameters = { query: 'carol', limit: 10 };
			const response = await apiOk({ endpoint: 'users/search', parameters, user: alice });
			const expected = [await show(carol.id, alice)];
			assert.deepStrictEqual(response, expected);
		});
		test('を検索することができる(UserLite)', async () => {
			const parameters = { query: 'carol', detail: false, limit: 10 };
			const response = await apiOk({ endpoint: 'users/search', parameters, user: alice });
			const expected = [userLite(await show(carol.id, alice) as any)];
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: (): User => userNotExplorable },
			{ label: 'ミュートユーザーが含まれる', user: (): User => userMutedByAlice },
			{ label: 'ブロックされているユーザーが含まれる', user: (): User => userBlockedByAlice },
			{ label: 'ブロックしてきているユーザーが含まれる', user: (): User => userBlockingAlice },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			{ label: 'サスペンドユーザーが含まれない', user: (): User => userSuspended, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('を検索することができ、結果に$labelが含まれる', async ({ user, excluded }) => {
			const parameters = { query: user().username, limit: 1 };
			const response = await apiOk({ endpoint: 'users/search', parameters, user: alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
			assert.deepStrictEqual(response, expected);
		});
		test.todo('を検索することができる(リモート)');
		test.todo('を検索することができる(pagenation)');

		//#endregion
		//#region ID指定検索(users/search-by-username-and-host)

		test.each([
			{ label: '自分', parameters: { username: 'alice' }, user: (): User[] => [alice] },
			{ label: '自分かつusernameが大文字', parameters: { username: 'ALICE' }, user: (): User[] => [alice] },
			{ label: 'ローカルのフォロイーでノートなし', parameters: { username: 'userFollowedByAlice' }, user: (): User[] => [userFollowedByAlice] },
			{ label: 'ローカルでノートなしは検索に載らない', parameters: { username: 'userNoNote' }, user: (): User[] => [] },
			{ label: 'ローカルの他人1', parameters: { username: 'bob' }, user: (): User[] => [bob] },
			{ label: 'ローカルの他人2', parameters: { username: 'bob', host: null }, user: (): User[] => [bob] },
			{ label: 'ローカルの他人3', parameters: { username: 'bob', host: '.' }, user: (): User[] => [bob] },
			{ label: 'ローカル', parameters: { host: null, limit: 1 }, user: (): User[] => [userFollowedByAlice] },
			{ label: 'ローカル', parameters: { host: '.', limit: 1 }, user: (): User[] => [userFollowedByAlice] },
		])('をID&ホスト指定で検索できる($label)', async ({ parameters, user }) => {
			const response = await apiOk({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
			const expected = await Promise.all(user().map(u => show(u.id, alice)));
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: (): User => userNotExplorable },
			{ label: 'ミュートユーザーが含まれる', user: (): User => userMutedByAlice },
			{ label: 'ブロックされているユーザーが含まれる', user: (): User => userBlockedByAlice },
			{ label: 'ブロックしてきているユーザーが含まれる', user: (): User => userBlockingAlice },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			{ label: 'サスペンドユーザーが含まれない', user: (): User => userSuspended, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('をID&ホスト指定で検索でき、結果に$label', async ({ user, excluded }) => {
			const parameters = { username: user().username };
			const response = await apiOk({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
			assert.deepStrictEqual(response, expected);
		});
		test.todo('をID&ホスト指定で検索できる(リモート)');

		//#endregion
		//#region ID指定検索(users/get-frequently-replied-users)

		test('がよくリプライをするユーザーのリストを取得できる', async () => {
			const parameters = { userId: alice.id, limit: 5 };
			const response = await apiOk({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
			const expected = await Promise.all(usersReplying.slice(0, parameters.limit).map(async (s, i) => ({
				user: await show(s.id, alice),
				weight: (usersReplying.length - i) / usersReplying.length,
			})));
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: (): User => userNotExplorable },
			{ label: 'ミュートユーザーが含まれる', user: (): User => userMutedByAlice },
			{ label: 'ブロックされているユーザーが含まれる', user: (): User => userBlockedByAlice },
			{ label: 'ブロックしてきているユーザーが含まれない', user: (): User => userBlockingAlice, excluded: true },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			//{ label: 'サスペンドユーザーが含まれない', user: (): User => userSuspended, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('がよくリプライをするユーザーのリストを取得でき、結果に$label', async ({ user, excluded }) => {
			const replyTo = (await apiOk({ endpoint: 'users/notes', parameters: { userId: user().id }, user: undefined }))[0];
			await post(alice, { text: `@${user().username} test`, replyId: replyTo.id });
			const parameters = { userId: alice.id, limit: 100 };
			const response = await apiOk({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
			assert.deepStrictEqual(response.map(s => s.user).filter((u) => u.id === user().id), expected);
		});

		//#endregion
		//#region ハッシュタグ(hashtags/users)

		test.each([
			{ label: 'フォロワー昇順', sort: { sort: '+follower' }, selector: (u: UserDetailedNotMe): string => String(u.followersCount) },
			{ label: 'フォロワー降順', sort: { sort: '-follower' }, selector: (u: UserDetailedNotMe): string => String(u.followersCount) },
			{ label: '登録日時昇順', sort: { sort: '+createdAt' }, selector: (u: UserDetailedNotMe): string => u.createdAt },
			{ label: '登録日時降順', sort: { sort: '-createdAt' }, selector: (u: UserDetailedNotMe): string => u.createdAt },
			{ label: '投稿日時昇順', sort: { sort: '+updatedAt' }, selector: (u: UserDetailedNotMe): string => String(u.updatedAt) },
			{ label: '投稿日時降順', sort: { sort: '-updatedAt' }, selector: (u: UserDetailedNotMe): string => String(u.updatedAt) },
		] as const)('をハッシュタグ指定で取得することができる($label)', async ({ sort, selector }) => {
			const hashtag = 'test_hashtag';
			await apiOk({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: alice });
			const parameters = { tag: hashtag, limit: 5, ...sort };
			const response = await apiOk({ endpoint: 'hashtags/users', parameters, user: alice });
			const users = await Promise.all(response.map(u => show(u.id, alice)));
			const expected = users.sort((x, y) => {
				const index = (selector(x) < selector(y)) ? -1 : (selector(x) > selector(y)) ? 1 : 0;
				return index * (parameters.sort.startsWith('+') ? -1 : 1);
			});
			assert.deepStrictEqual(response, expected);
		});
		test.each([
			{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: (): User => userNotExplorable },
			{ label: 'ミュートユーザーが含まれる', user: (): User => userMutedByAlice },
			{ label: 'ブロックされているユーザーが含まれる', user: (): User => userBlockedByAlice },
			{ label: 'ブロックしてきているユーザーが含まれる', user: (): User => userBlockingAlice },
			{ label: '承認制ユーザーが含まれる', user: (): User => userLocking },
			{ label: 'サイレンスユーザーが含まれる', user: (): User => userSilenced },
			{ label: 'サスペンドユーザーが含まれない', user: (): User => userSuspended, excluded: true },
			{ label: '削除済ユーザーが含まれる', user: (): User => userDeletedBySelf },
			{ label: '削除済(byAdmin)ユーザーが含まれる', user: (): User => userDeletedByAdmin },
		] as const)('をハッシュタグ指定で取得することができ、結果に$label', async ({ user, excluded }) => {
			const hashtag = `user_test${user().username}`;
			if (user() !== userSuspended) {
				// サスペンドユーザーはupdateできない。
				await apiOk({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: user() });
			}
			const parameters = { tag: hashtag, limit: 100, sort: '-follower' } as const;
			const response = await apiOk({ endpoint: 'hashtags/users', parameters, user: alice });
			const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
			assert.deepStrictEqual(response, expected);
		});
		test.todo('をハッシュタグ指定で取得することができる(リモート)');

		//#endregion
		//#region オススメユーザー(users/recommendation)

		// BUG users/recommendationは壊れている？ > QueryFailedError: missing FROM-clause entry for table "note"
		test.skip('のオススメを取得することができる', async () => {
			const parameters = {};
			const response = await apiOk({ endpoint: 'users/recommendation', parameters, user: alice });
			const expected = await Promise.all(response.map(u => show(u.id)));
			assert.deepStrictEqual(response, expected);
		});

		//#endregion
		//#region ピン止めユーザー(pinned-users)

		test('のピン止めユーザーを取得することができる', async () => {
			await apiOk({ endpoint: 'admin/update-meta', parameters: { pinnedUsers: [bob.username, `@${carol.username}`] }, user: root });
			const parameters = {} as const;
			const response = await apiOk({ endpoint: 'pinned-users', parameters, user: alice });
			const expected = await Promise.all([bob, carol].map(u => show(u.id, alice)));
			assert.deepStrictEqual(response, expected);
		});

		//#endregion

		test.todo('を管理人として確認することができる(admin/show-user)');
		test.todo('を管理人として確認することができる(admin/show-users)');
		test.todo('をサーバー向けに取得することができる(federation/users)');
	});

	describe('2要素認証', () => {
		// #region 二要素認証(i/2fa/*)
		const config = loadConfig();
		const password = 'test';
		const username = 'alice';

		// https://datatracker.ietf.org/doc/html/rfc8152
		// 各値の定義は上記規格に基づく。鍵ペアは適当に生成したやつ
		const coseKtyEc2 = 2;
		const coseKid = 'meriadoc.brandybuck@buckland.example';
		const coseAlgEs256 = -7;
		const coseEc2CrvP256 = 1;
		const coseEc2X = '4932eaacc657565705e4287e7870ce3aad55545d99d35a98a472dc52880cfc8f';
		const coseEc2Y = '5ca68303bf2c0433473e3d5cb8586bc2c8c43a4945a496fce8dbeda8b23ab0b1';

		// private key only for testing
		const pemToSign = '-----BEGIN EC PRIVATE KEY-----\n' +
			'MHcCAQEEIHqe/keuXyolbXzgLOu+YFJjDBGWVgXc3QCXfyqwDPf2oAoGCCqGSM49\n' +
			'AwEHoUQDQgAESTLqrMZXVlcF5Ch+eHDOOq1VVF2Z01qYpHLcUogM/I9cpoMDvywE\n' +
			'M0c+PVy4WGvCyMQ6SUWklvzo2+2osjqwsQ==\n' +
			'-----END EC PRIVATE KEY-----\n';

		const otpToken = (secret: string): string => {
			return OTPAuth.TOTP.generate({
				secret: OTPAuth.Secret.fromBase32(secret),
				digits: 6,
			});
		};

		const rpIdHash = (): Buffer => {
			return crypto.createHash('sha256')
				.update(Buffer.from(config.hostname, 'utf-8'))
				.digest();
		};

		const keyDoneParam = (param: {
			keyName: string,
			challengeId: string,
			challenge: string,
			credentialId: Buffer,
		}): {
			attestationObject: string,
			challengeId: string,
			clientDataJSON: string,
			password: string,
			name: string,
		} => {
			// A COSE encoded public key
			const credentialPublicKey = cbor.encode(new Map<number, unknown>([
				[-1, coseEc2CrvP256],
				[-2, Buffer.from(coseEc2X, 'hex')],
				[-3, Buffer.from(coseEc2Y, 'hex')],
				[1, coseKtyEc2],
				[2, coseKid],
				[3, coseAlgEs256],
			]));

			// AuthenticatorAssertionResponse.authenticatorData
			// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData 
			const credentialIdLength = Buffer.allocUnsafe(2);
			credentialIdLength.writeUInt16BE(param.credentialId.length);
			const authData = Buffer.concat([
				rpIdHash(), // rpIdHash(32)
				Buffer.from([0x45]), // flags(1)
				Buffer.from([0x00, 0x00, 0x00, 0x00]), // signCount(4)
				Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // AAGUID(16)
				credentialIdLength,
				param.credentialId,
				credentialPublicKey,
			]);

			return {
				attestationObject: cbor.encode({
					fmt: 'none',
					attStmt: {},
					authData,
				}).toString('hex'),
				challengeId: param.challengeId,
				clientDataJSON: JSON.stringify({
					type: 'webauthn.create',
					challenge: param.challenge,
					origin: config.scheme + '://' + config.host,
					androidPackageName: 'org.mozilla.firefox',
				}),
				password,
				name: param.keyName,
			};
		};

		const signinParam = (): {
			username: string,
			password: string,
			'g-recaptcha-response'?: string | null,
			'hcaptcha-response'?: string | null,
		} => {
			return {
				username,
				password,
				'g-recaptcha-response': null,
				'hcaptcha-response': null,
			};
		};

		const signinWithSecurityKeyParam = (param: {
			keyName: string,
			challengeId: string,
			challenge: string,
			credentialId: Buffer,
		}): {
			authenticatorData: string,
			credentialId: string,
			challengeId: string,
			clientDataJSON: string,
			username: string,
			password: string,
			signature: string,
			'g-recaptcha-response'?: string | null,
			'hcaptcha-response'?: string | null,
		} => {
			// AuthenticatorAssertionResponse.authenticatorData
			// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData 
			const authenticatorData = Buffer.concat([
				rpIdHash(),
				Buffer.from([0x05]), // flags(1)
				Buffer.from([0x00, 0x00, 0x00, 0x01]), // signCount(4)
			]);
			const clientDataJSONBuffer = Buffer.from(JSON.stringify({
				type: 'webauthn.get',
				challenge: param.challenge,
				origin: config.scheme + '://' + config.host,
				androidPackageName: 'org.mozilla.firefox',
			}));
			const hashedclientDataJSON = crypto.createHash('sha256')
				.update(clientDataJSONBuffer)
				.digest();
			const privateKey = crypto.createPrivateKey(pemToSign);
			const signature = crypto.createSign('SHA256')
				.update(Buffer.concat([authenticatorData, hashedclientDataJSON]))
				.sign(privateKey);
			return {
				authenticatorData: authenticatorData.toString('hex'),
				credentialId: param.credentialId.toString('base64'),
				challengeId: param.challengeId,
				clientDataJSON: clientDataJSONBuffer.toString('hex'),
				username,
				password,
				signature: signature.toString('hex'),
				'g-recaptcha-response': null,
				'hcaptcha-response': null,
			};
		};

		test('が設定でき、OTPでログインできる。', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);
			assert.notEqual(registerResponse.body.qr, undefined);
			assert.notEqual(registerResponse.body.url, undefined);
			assert.notEqual(registerResponse.body.secret, undefined);
			assert.strictEqual(registerResponse.body.label, username);
			assert.strictEqual(registerResponse.body.issuer, config.host);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const usersShowResponse = await api('/users/show', {
				username,
			}, alice);
			assert.strictEqual(usersShowResponse.status, 200);
			assert.strictEqual(usersShowResponse.body.twoFactorEnabled, true);

			const signinResponse = await api('/signin', {
				...signinParam(),
				token: otpToken(registerResponse.body.secret),
			});
			assert.strictEqual(signinResponse.status, 200);
			assert.notEqual(signinResponse.body.i, undefined);
		});

		test('が設定でき、セキュリティキーでログインできる。', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const registerKeyResponse = await api('/i/2fa/register-key', {
				password,
			}, alice);
			assert.strictEqual(registerKeyResponse.status, 200);
			assert.notEqual(registerKeyResponse.body.challengeId, undefined);
			assert.notEqual(registerKeyResponse.body.challenge, undefined);

			const keyName = 'example-key';
			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('/i/2fa/key-done', keyDoneParam({
				keyName,
				challengeId: registerKeyResponse.body.challengeId,
				challenge: registerKeyResponse.body.challenge,
				credentialId,
			}), alice);
			assert.strictEqual(keyDoneResponse.status, 200);
			assert.strictEqual(keyDoneResponse.body.id, credentialId.toString('hex'));
			assert.strictEqual(keyDoneResponse.body.name, keyName);

			const usersShowResponse = await api('/users/show', {
				username,
			});
			assert.strictEqual(usersShowResponse.status, 200);
			assert.strictEqual(usersShowResponse.body.securityKeys, true);

			const signinResponse = await api('/signin', {
				...signinParam(),
			});
			assert.strictEqual(signinResponse.status, 200);
			assert.strictEqual(signinResponse.body.i, undefined);
			assert.notEqual(signinResponse.body.challengeId, undefined);
			assert.notEqual(signinResponse.body.challenge, undefined);
			assert.notEqual(signinResponse.body.securityKeys, undefined);
			assert.strictEqual(signinResponse.body.securityKeys[0].id, credentialId.toString('hex'));

			const signinResponse2 = await api('/signin', signinWithSecurityKeyParam({
				keyName,
				challengeId: signinResponse.body.challengeId,
				challenge: signinResponse.body.challenge,
				credentialId,
			}));
			assert.strictEqual(signinResponse2.status, 200);
			assert.notEqual(signinResponse2.body.i, undefined);
		});

		test('が設定でき、セキュリティキーでパスワードレスログインできる。', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const registerKeyResponse = await api('/i/2fa/register-key', {
				password,
			}, alice);
			assert.strictEqual(registerKeyResponse.status, 200);

			const keyName = 'example-key';
			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('/i/2fa/key-done', keyDoneParam({
				keyName,
				challengeId: registerKeyResponse.body.challengeId,
				challenge: registerKeyResponse.body.challenge,
				credentialId,
			}), alice);
			assert.strictEqual(keyDoneResponse.status, 200);

			const passwordLessResponse = await api('/i/2fa/password-less', {
				value: true,
			}, alice);
			assert.strictEqual(passwordLessResponse.status, 204);

			const usersShowResponse = await api('/users/show', {
				username,
			});
			assert.strictEqual(usersShowResponse.status, 200);
			assert.strictEqual(usersShowResponse.body.usePasswordLessLogin, true);

			const signinResponse = await api('/signin', {
				...signinParam(),
				password: '',
			});
			assert.strictEqual(signinResponse.status, 200);
			assert.strictEqual(signinResponse.body.i, undefined);

			const signinResponse2 = await api('/signin', {
				...signinWithSecurityKeyParam({
					keyName,
					challengeId: signinResponse.body.challengeId,
					challenge: signinResponse.body.challenge,
					credentialId,
				}),
				password: '',
			});
			assert.strictEqual(signinResponse2.status, 200);
			assert.notEqual(signinResponse2.body.i, undefined);
		});

		test('が設定でき、設定したセキュリティキーの名前を変更できる。', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const registerKeyResponse = await api('/i/2fa/register-key', {
				password,
			}, alice);
			assert.strictEqual(registerKeyResponse.status, 200);

			const keyName = 'example-key';
			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('/i/2fa/key-done', keyDoneParam({
				keyName,
				challengeId: registerKeyResponse.body.challengeId,
				challenge: registerKeyResponse.body.challenge,
				credentialId,
			}), alice);
			assert.strictEqual(keyDoneResponse.status, 200);

			const renamedKey = 'other-key';
			const updateKeyResponse = await api('/i/2fa/update-key', {
				name: renamedKey,
				credentialId: credentialId.toString('hex'),
			}, alice);
			assert.strictEqual(updateKeyResponse.status, 200);

			const iResponse = await api('/i', {
			}, alice);
			assert.strictEqual(iResponse.status, 200);
			const securityKeys = iResponse.body.securityKeysList.filter(s => s.id === credentialId.toString('hex'));
			assert.strictEqual(securityKeys.length, 1);
			assert.strictEqual(securityKeys[0].name, renamedKey);
			assert.notEqual(securityKeys[0].lastUsed, undefined);
		});

		test('が設定でき、設定したセキュリティキーを削除できる。', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const registerKeyResponse = await api('/i/2fa/register-key', {
				password,
			}, alice);
			assert.strictEqual(registerKeyResponse.status, 200);

			const keyName = 'example-key';
			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('/i/2fa/key-done', keyDoneParam({
				keyName,
				challengeId: registerKeyResponse.body.challengeId,
				challenge: registerKeyResponse.body.challenge,
				credentialId,
			}), alice);
			assert.strictEqual(keyDoneResponse.status, 200);

			// テストの実行順によっては複数残ってるので全部消す
			const iResponse = await api('/i', {
			}, alice);
			assert.strictEqual(iResponse.status, 200);
			for (const key of iResponse.body.securityKeysList) {
				const removeKeyResponse = await api('/i/2fa/remove-key', {
					password,
					credentialId: key.id,
				}, alice);
				assert.strictEqual(removeKeyResponse.status, 200);
			}

			const usersShowResponse = await api('/users/show', {
				username,
			});
			assert.strictEqual(usersShowResponse.status, 200);
			assert.strictEqual(usersShowResponse.body.securityKeys, false);

			const signinResponse = await api('/signin', {
				...signinParam(),
				token: otpToken(registerResponse.body.secret),
			});
			assert.strictEqual(signinResponse.status, 200);
			assert.notEqual(signinResponse.body.i, undefined);
		});

		test('が設定でき、設定解除できる。（パスワードのみでログインできる。）', async () => {
			const registerResponse = await api('/i/2fa/register', {
				password,
			}, alice);
			assert.strictEqual(registerResponse.status, 200);

			const doneResponse = await api('/i/2fa/done', {
				token: otpToken(registerResponse.body.secret),
			}, alice);
			assert.strictEqual(doneResponse.status, 204);

			const usersShowResponse = await api('/users/show', {
				username,
			});
			assert.strictEqual(usersShowResponse.status, 200);
			assert.strictEqual(usersShowResponse.body.twoFactorEnabled, true);

			const unregisterResponse = await api('/i/2fa/unregister', {
				password,
			}, alice);
			assert.strictEqual(unregisterResponse.status, 204);

			const signinResponse = await api('/signin', {
				...signinParam(),
			});
			assert.strictEqual(signinResponse.status, 200);
			assert.notEqual(signinResponse.body.i, undefined);
		});
		// #endregion
	});

	describe('その他のエンドポイント', () => {
		// #region test(検証用エンドポイント)
		describe('/testエンドポイント (バリデーションのテスト)', () => {
			test('wrong type', async () => {
				const res = await api('/test', {
					required: true,
					string: 42,
				});
				assert.strictEqual(res.status, 400);
			});

			test('missing require param', async () => {
				const res = await api('/test', {
					string: 'a',
				});
				assert.strictEqual(res.status, 400);
			});

			test('invalid misskey:id (empty string)', async () => {
				const res = await api('/test', {
					required: true,
					id: '',
				});
				assert.strictEqual(res.status, 400);
			});

			test('valid misskey:id', async () => {
				const res = await api('/test', {
					required: true,
					id: '8wvhjghbxu',
				});
				assert.strictEqual(res.status, 200);
			});

			test('default value', async () => {
				const res = await api('/test', {
					required: true,
					string: 'a',
				});
				assert.strictEqual(res.status, 200);
				assert.strictEqual(res.body.default, 'hello');
			});

			test('can set null even if it has default value', async () => {
				const res = await api('/test', {
					required: true,
					nullableDefault: null,
				});
				assert.strictEqual(res.status, 200);
				assert.strictEqual(res.body.nullableDefault, null);
			});

			test('cannot set undefined if it has default value', async () => {
				const res = await api('/test', {
					required: true,
					nullableDefault: undefined,
				});
				assert.strictEqual(res.status, 200);
				assert.strictEqual(res.body.nullableDefault, 'hello');
			});
		});
		// #endregion
	});
});
