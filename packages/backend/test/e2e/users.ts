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
	page,
	role,
	startServer,
	api,
	successfulApiCall,
	failedApiCall,
	uploadFile,
} from '../utils.js';
import type * as misskey from 'misskey-js';
import type { INestApplicationContext } from '@nestjs/common';

describe('ユーザー', () => {
	// エンティティとしてのユーザーを主眼においたテストを記述する
	// (Userを返すエンドポイントとUserエンティティを書き換えるエンドポイントをテストする)

	const stripUndefined = <T extends { [key: string]: any }, >(orig: T): Partial<T> => {
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

	type User = MeDetailed & { token: string };

	const show = async (id: string, me = root): Promise<MeDetailed | UserDetailedNotMe> => {
		return successfulApiCall({ endpoint: 'users/show', parameters: { userId: id }, user: me }) as any;
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
	const meDetailed = (user: User, security = false): Partial<MeDetailed> => {
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
		});
	};

	let app: INestApplicationContext;

	let root: User;
	let alice: User;
	let aliceNote: misskey.entities.Note;
	let alicePage: misskey.entities.Page;
	let aliceList: misskey.entities.UserList;

	let bob: User;
	let bobNote: misskey.entities.Note;

	let carol: User;
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

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
		aliceNote = await post(alice, { text: 'test' }) as any;
		alicePage = await page(alice);
		aliceList = (await api('users/list/create', { name: 'aliceList' }, alice)).body;
		bob = await signup({ username: 'bob' });
		bobNote = await post(bob, { text: 'test' }) as any;
		carol = await signup({ username: 'carol' });
		dave = await signup({ username: 'dave' });
		ellen = await signup({ username: 'ellen' });
		frank = await signup({ username: 'frank' });

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
		await api('i/update', { isExplorable: false }, userNotExplorable);
		userLocking = await signup({ username: 'userLocking' });
		await post(userLocking, { text: 'test' });
		await api('i/update', { isLocked: true }, userLocking);
		userAdmin = await signup({ username: 'userAdmin' });
		roleAdmin = await role(root, { isAdministrator: true, name: 'Admin Role' });
		await api('admin/roles/assign', { userId: userAdmin.id, roleId: roleAdmin.id }, root);
		userModerator = await signup({ username: 'userModerator' });
		roleModerator = await role(root, { isModerator: true, name: 'Moderator Role' });
		await api('admin/roles/assign', { userId: userModerator.id, roleId: roleModerator.id }, root);
		userRolePublic = await signup({ username: 'userRolePublic' });
		rolePublic = await role(root, { isPublic: true, name: 'Public Role' });
		await api('admin/roles/assign', { userId: userRolePublic.id, roleId: rolePublic.id }, root);
		userRoleBadge = await signup({ username: 'userRoleBadge' });
		roleBadge = await role(root, { asBadge: true, name: 'Badge Role' });
		await api('admin/roles/assign', { userId: userRoleBadge.id, roleId: roleBadge.id }, root);
		userSilenced = await signup({ username: 'userSilenced' });
		await post(userSilenced, { text: 'test' });
		roleSilenced = await role(root, {}, { canPublicNote: { priority: 0, useDefault: false, value: false } });
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
		userFollowingAlice = await signup({ username: 'userFollowingAlice' });
		await post(userFollowingAlice, { text: 'test' });
		await api('following/create', { userId: alice.id }, userFollowingAlice);
		userFollowedByAlice = await signup({ username: 'userFollowedByAlice' });
		await post(userFollowedByAlice, { text: 'test' });
		await api('following/create', { userId: userFollowedByAlice.id }, alice);
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
		userRnMutingAlice = await signup({ username: 'userRnMutingAlice' });
		await post(userRnMutingAlice, { text: 'test' });
		await api('renote-mute/create', { userId: alice.id }, userRnMutingAlice);
		userRnMutedByAlice = await signup({ username: 'userRnMutedByAlice' });
		await post(userRnMutedByAlice, { text: 'test' });
		await api('renote-mute/create', { userId: userRnMutedByAlice.id }, alice);
		userFollowRequesting = await signup({ username: 'userFollowRequesting' });
		await post(userFollowRequesting, { text: 'test' });
		userFollowRequested = userLocking;
		await api('following/create', { userId: userFollowRequested.id }, userFollowRequesting);
	}, 1000 * 60 * 10);

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		alice = {
			...alice,
			...await successfulApiCall({ endpoint: 'i', parameters: {}, user: alice }) as any,
		};
		aliceNote = await successfulApiCall({ endpoint: 'notes/show', parameters: { noteId: aliceNote.id }, user: alice });
	});

	//#region サインアップ(signup)

	test('が作れる。（作りたての状態で自分のユーザー情報が取れる）', async () => {
		// SignupApiService.ts
		const response = await successfulApiCall({
			endpoint: 'signup',
			parameters: { username: 'zoe', password: 'password' },
			user: undefined,
		}) as unknown as User; // BUG MeDetailedに足りないキーがある

		// signupの時はtokenが含まれる特別なMeDetailedが返ってくる
		assert.match(response.token, /[a-zA-Z0-9]{16}/);

		// UserLite
		assert.match(response.id, /[0-9a-z]{10}/);
		assert.strictEqual(response.name, null);
		assert.strictEqual(response.username, 'zoe');
		assert.strictEqual(response.host, null);
		assert.match(response.avatarUrl, /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
		assert.strictEqual(response.avatarBlurhash, null);
		assert.strictEqual(response.isBot, false);
		assert.strictEqual(response.isCat, false);
		assert.strictEqual(response.instance, undefined);
		assert.deepStrictEqual(response.emojis, {});
		assert.strictEqual(response.onlineStatus, 'unknown');
		assert.deepStrictEqual(response.badgeRoles, []);
		// UserDetailedNotMeOnly
		assert.strictEqual(response.url, null);
		assert.strictEqual(response.uri, null);
		assert.strictEqual(response.movedTo, null);
		assert.strictEqual(response.alsoKnownAs, null);
		assert.strictEqual(response.createdAt, new Date(response.createdAt).toISOString());
		assert.strictEqual(response.updatedAt, null);
		assert.strictEqual(response.lastFetchedAt, null);
		assert.strictEqual(response.bannerUrl, null);
		assert.strictEqual(response.bannerBlurhash, null);
		assert.strictEqual(response.isLocked, false);
		assert.strictEqual(response.isSilenced, false);
		assert.strictEqual(response.isSuspended, false);
		assert.strictEqual(response.description, null);
		assert.strictEqual(response.location, null);
		assert.strictEqual(response.birthday, null);
		assert.strictEqual(response.lang, null);
		assert.deepStrictEqual(response.fields, []);
		assert.strictEqual(response.followersCount, 0);
		assert.strictEqual(response.followingCount, 0);
		assert.strictEqual(response.notesCount, 0);
		assert.deepStrictEqual(response.pinnedNoteIds, []);
		assert.deepStrictEqual(response.pinnedNotes, []);
		assert.strictEqual(response.pinnedPageId, null);
		assert.strictEqual(response.pinnedPage, null);
		assert.strictEqual(response.publicReactions, true);
		assert.strictEqual(response.ffVisibility, 'public');
		assert.strictEqual(response.twoFactorEnabled, false);
		assert.strictEqual(response.usePasswordLessLogin, false);
		assert.strictEqual(response.securityKeys, false);
		assert.deepStrictEqual(response.roles, []);
		assert.strictEqual(response.memo, null);

		// MeDetailedOnly
		assert.strictEqual(response.avatarId, null);
		assert.strictEqual(response.bannerId, null);
		assert.strictEqual(response.isModerator, false);
		assert.strictEqual(response.isAdmin, false);
		assert.strictEqual(response.injectFeaturedNote, true);
		assert.strictEqual(response.receiveAnnouncementEmail, true);
		assert.strictEqual(response.alwaysMarkNsfw, false);
		assert.strictEqual(response.autoSensitive, false);
		assert.strictEqual(response.carefulBot, false);
		assert.strictEqual(response.autoAcceptFollowed, true);
		assert.strictEqual(response.noCrawle, false);
		assert.strictEqual(response.preventAiLearning, true);
		assert.strictEqual(response.isExplorable, true);
		assert.strictEqual(response.isDeleted, false);
		assert.strictEqual(response.hideOnlineStatus, false);
		assert.strictEqual(response.hasUnreadSpecifiedNotes, false);
		assert.strictEqual(response.hasUnreadMentions, false);
		assert.strictEqual(response.hasUnreadAnnouncement, false);
		assert.strictEqual(response.hasUnreadAntenna, false);
		assert.strictEqual(response.hasUnreadChannel, false);
		assert.strictEqual(response.hasUnreadNotification, false);
		assert.strictEqual(response.hasPendingReceivedFollowRequest, false);
		assert.deepStrictEqual(response.mutedWords, []);
		assert.deepStrictEqual(response.mutedInstances, []);
		assert.deepStrictEqual(response.mutingNotificationTypes, []);
		assert.deepStrictEqual(response.emailNotificationTypes, ['follow', 'receiveFollowRequest']);
		assert.deepStrictEqual(response.achievements, []);
		assert.deepStrictEqual(response.loggedInDays, 0);
		assert.deepStrictEqual(response.policies, DEFAULT_POLICIES);
		assert.notStrictEqual(response.email, undefined);
		assert.strictEqual(response.emailVerified, false);
		assert.deepStrictEqual(response.securityKeysList, []);
	});

	//#endregion
	//#region 自分の情報(i)

	test('を読み取ることができること（自分）、キーが過不足なく入っていること。', async () => {
		const response = await successfulApiCall({
			endpoint: 'i',
			parameters: {},
			user: userNoNote,
		});
		const expected = meDetailed(userNoNote, true);
		expected.loggedInDays = 1; // iはloggedInDaysを更新する
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region 自分の情報の更新(i/update)

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
		{ parameters: (): object => ({ hideOnlineStatus: true }) },
		{ parameters: (): object => ({ hideOnlineStatus: false }) },
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
	] as const)('を書き換えることができる($#)', async ({ parameters }) => {
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters(), user: alice });
		const expected = { ...meDetailed(alice, true), ...parameters() };
		assert.deepStrictEqual(response, expected, inspect(parameters()));
	});

	test('を書き換えることができる(Avatar)', async () => {
		const aliceFile = (await uploadFile(alice)).body;
		const parameters = { avatarId: aliceFile.id };
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters, user: alice });
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
		const response2 = await successfulApiCall({ endpoint: 'i/update', parameters: parameters2, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters, user: alice });
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
		const response2 = await successfulApiCall({ endpoint: 'i/update', parameters: parameters2, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'i/pin', parameters, user: alice });
		const expected = { ...meDetailed(alice, false), pinnedNoteIds: [aliceNote.id], pinnedNotes: [aliceNote] };
		assert.deepStrictEqual(response, expected);

		const response2 = await successfulApiCall({ endpoint: 'i/unpin', parameters, user: alice });
		const expected2 = meDetailed(alice, false);
		assert.deepStrictEqual(response2, expected2);
	});

	//#endregion
	//#region メモの更新(users/update-memo)

	test.each([
		{ label: '最大長', memo: 'x'.repeat(2048) },
		{ label: '空文字', memo: '', expects: null },
		{ label: 'null', memo: null },
	])('を書き換えることができる(メモを$labelに)', async ({ memo, expects }) => {
		const expected = { ...await show(bob.id, alice), memo: expects === undefined ? memo : expects };
		const parameters = { userId: bob.id, memo };
		await successfulApiCall({ endpoint: 'users/update-memo', parameters, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'users', parameters, user: alice });

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
		const response = await successfulApiCall({ endpoint: 'users', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response.filter((u) => u.id === user().id), expected);
	});
	test.todo('をリスト形式で取得することができる（リモート, hostname指定）');
	test.todo('をリスト形式で取得することができる（pagenation）');

	//#endregion
	//#region ユーザー情報(users/show)

	test.each([
		{ label: 'ID指定で自分自身を', parameters: (): object => ({ userId: alice.id }), user: (): User => alice, type: meDetailed },
		{ label: 'ID指定で他人を', parameters: (): object => ({ userId: alice.id }), user: (): User => bob, type: userDetailedNotMeWithRelations },
		{ label: 'ID指定かつ未認証', parameters: (): object => ({ userId: alice.id }), user: undefined, type: userDetailedNotMe },
		{ label: '@指定で自分自身を', parameters: (): object => ({ username: alice.username }), user: (): User => alice, type: meDetailed },
		{ label: '@指定で他人を', parameters: (): object => ({ username: alice.username }), user: (): User => bob, type: userDetailedNotMeWithRelations },
		{ label: '@指定かつ未認証', parameters: (): object => ({ username: alice.username }), user: undefined, type: userDetailedNotMe },
	] as const)('を取得することができる（$label）', async ({ parameters, user, type }) => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: parameters(), user: user?.() });
		const expected = type(alice);
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
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: user().id }, user: me?.() ?? alice });
		assert.strictEqual(selector(response), (expected ?? ((): true => true))());
	});
	test('を取得することができ、Publicなロールがセットされていること', async () => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: userRolePublic.id }, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: userRoleBadge.id }, user: alice });
		assert.deepStrictEqual(response.badgeRoles, [{
			name: roleBadge.name,
			iconUrl: roleBadge.iconUrl,
			displayOrder: roleBadge.displayOrder,
		}]);
		assert.deepStrictEqual(response.roles, []); // バッヂだからといってrolesが取れるとは限らない
	});
	test('をID指定のリスト形式で取得することができる（空）', async () => {
		const parameters = { userIds: [] };
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: alice });
		const expected: [] = [];
		assert.deepStrictEqual(response, expected);
	});
	test('をID指定のリスト形式で取得することができる', async() => {
		const parameters = { userIds: [bob.id, alice.id, carol.id] };
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: alice });
		const expected = [
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: bob.id }, user: alice }),
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: alice.id }, user: alice }),
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: carol.id }, user: alice }),
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
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: me?.() ?? alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, me?.() ?? alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をID指定のリスト形式で取得することができる(リモート)');

	//#endregion
	//#region 検索(users/search)

	test('を検索することができる', async () => {
		const parameters = { query: 'carol', limit: 10 };
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
		const expected = [await show(carol.id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test('を検索することができる(UserLite)', async () => {
		const parameters = { query: 'carol', detail: false, limit: 10 };
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
		const expected = [userLite(await show(carol.id, alice))];
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
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
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
		const response = await successfulApiCall({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をID&ホスト指定で検索できる(リモート)');

	//#endregion
	//#region ID指定検索(users/get-frequently-replied-users)

	test('がよくリプライをするユーザーのリストを取得できる', async () => {
		const parameters = { userId: alice.id, limit: 5 };
		const response = await successfulApiCall({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
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
		const replyTo = (await successfulApiCall({ endpoint: 'users/notes', parameters: { userId: user().id }, user: undefined }))[0];
		await post(alice, { text: `@${user().username} test`, replyId: replyTo.id });
		const parameters = { userId: alice.id, limit: 100 };
		const response = await successfulApiCall({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
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
		await successfulApiCall({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: alice });
		const parameters = { tag: hashtag, limit: 5, ...sort };
		const response = await successfulApiCall({ endpoint: 'hashtags/users', parameters, user: alice });
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
			await successfulApiCall({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: user() });
		}
		const parameters = { tag: hashtag, limit: 100, sort: '-follower' } as const;
		const response = await successfulApiCall({ endpoint: 'hashtags/users', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をハッシュタグ指定で取得することができる(リモート)');

	//#endregion
	//#region オススメユーザー(users/recommendation)

	// BUG users/recommendationは壊れている？ > QueryFailedError: missing FROM-clause entry for table "note"
	test.skip('のオススメを取得することができる', async () => {
		const parameters = {};
		const response = await successfulApiCall({ endpoint: 'users/recommendation', parameters, user: alice });
		const expected = await Promise.all(response.map(u => show(u.id)));
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region ピン止めユーザー(pinned-users)

	test('のピン止めユーザーを取得することができる', async () => {
		await successfulApiCall({ endpoint: 'admin/update-meta', parameters: { pinnedUsers: [bob.username, `@${carol.username}`] }, user: root });
		const parameters = {} as const;
		const response = await successfulApiCall({ endpoint: 'pinned-users', parameters, user: alice });
		const expected = await Promise.all([bob, carol].map(u => show(u.id, alice)));
		assert.deepStrictEqual(response, expected);
	});

	//#endregion

	test.todo('を管理人として確認することができる(admin/show-user)');
	test.todo('を管理人として確認することができる(admin/show-users)');
	test.todo('をサーバー向けに取得することができる(federation/users)');
});
