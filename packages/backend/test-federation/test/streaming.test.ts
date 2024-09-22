import { strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, isFired, resolveRemoteUser } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Streaming', () => {
	let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
	let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, aliceClient] = await createAccount('a.test', aAdminClient);
		[bob, bobClient] = await createAccount('b.test', bAdminClient);

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/users/${bob.id}`, aliceClient),
			resolveRemoteUser(`https://a.test/users/${alice.id}`, bobClient),
		]);

		await bobClient.request('following/create', { userId: aliceInBServer.id });
		await new Promise(resolve => setTimeout(resolve, 1000));
	});

	describe('Timelines', () => {
		async function postFromAlice(params?: Misskey.entities.NotesCreateRequest) {
			await aliceClient.request('notes/create', { text: 'a', ...params });
		}

		async function postAndCheckReception<C extends keyof Misskey.Channels & (`${string}Timeline` | 'userList' | 'antenna')>(
			timeline: C,
			expect: boolean,
			noteParams: Misskey.entities.NotesCreateRequest = {},
			channelParams: Misskey.Channels[C]['params'] = {},
		) {
			const text = noteParams.text ?? crypto.randomUUID();
			const fired = await isFired(
				'https://b.test', bob, timeline,
				async () => await postFromAlice({ text, ...noteParams }),
				'note', msg => msg.text === text,
				channelParams,
			);
			strictEqual(fired, expect);
		}

		describe('homeTimeline', () => {
			// NOTE: narrowing scope intentionally to prevent mistakes by copy-and-paste
			const homeTimeline = 'homeTimeline';

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(homeTimeline, true);
			});

			test('Receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'home' });
			});

			test('Receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'followers' });
			});

			test('Receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'specified', visibleUserIds: [bobInAServer.id] });
			});
		});

		describe('localTimeline', () => {
			const localTimeline = 'localTimeline';

			test('Don\'t receive remote followee\'s note', async () => {
				await postAndCheckReception(localTimeline, false, { visibility: 'followers', visibleUserIds: [bobInAServer.id] });
			});
		});

		describe('hybridTimeline', () => {
			const hybridTimeline = 'hybridTimeline';

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(hybridTimeline, true);
			});

			test('Receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'home' });
			});

			test('Receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'followers' });
			});

			test('Receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'specified', visibleUserIds: [bobInAServer.id] });
			});
		});

		describe('globalTimeline', () => {
			const globalTimeline = 'globalTimeline';

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(globalTimeline, true);
			});

			test('Don\'t receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'home' });
			});

			test('Don\'t receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'followers' });
			});

			test('Don\'t receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'specified', visibleUserIds: [bobInAServer.id] });
			});
		});

		describe('userList', () => {
			const userList = 'userList';

			let list: Misskey.entities.UserList;

			beforeAll(async () => {
				list = await bobClient.request('users/lists/create', { name: 'Bob\'s List' });
				await bobClient.request('users/lists/push', { listId: list.id, userId: aliceInBServer.id });
				await new Promise(resolve => setTimeout(resolve, 1000));
			});

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(userList, true, {}, { listId: list.id });
			});

			test('Receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'home' }, { listId: list.id });
			});

			test('Receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'followers' }, { listId: list.id });
			});

			test('Receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'specified', visibleUserIds: [bobInAServer.id] }, { listId: list.id });
			});
		});

		describe('roleTimeline', () => {
			const roleTimeline = 'roleTimeline';

			let role: Misskey.entities.Role;

			beforeAll(async () => {
				role = await bAdminClient.request('admin/roles/create', {
					name: 'Remote Users',
					description: 'Remote users are assigned to this role.',
					color: null,
					iconUrl: null,
					target: 'conditional',
					condFormula: {
						type: 'isRemote' as never,
					},
					isPublic: true,
					isModerator: false,
					isAdministrator: false,
					isExplorable: true,
					asBadge: false,
					canEditMembersByModerator: false,
					displayOrder: 0,
					policies: {},
				});
				await new Promise(resolve => setTimeout(resolve, 1000));
			});

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(roleTimeline, true, {}, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'home' }, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'followers' }, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'specified', visibleUserIds: [bobInAServer.id] }, { roleId: role.id });
			});

			afterAll(async () => {
				await bAdminClient.request('admin/roles/delete', { roleId: role.id });
			});
		});

		// TODO: Cannot test
		describe.skip('antenna', () => {
			const antenna = 'antenna';

			let bobAntenna: Misskey.entities.Antenna;

			beforeAll(async () => {
				bobAntenna = await bobClient.request('antennas/create', {
					name: 'Bob\'s Egosurfing Antenna',
					src: 'all',
					keywords: [['Bob']],
					excludeKeywords: [],
					users: [],
					caseSensitive: false,
					localOnly: false,
					withReplies: true,
					withFile: true,
				});
				await new Promise(resolve => setTimeout(resolve, 1000));
			});

			test('Receive remote followee\'s note', async () => {
				await postAndCheckReception(antenna, true, { text: 'I love Bob (1)' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s home-only note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (2)', visibility: 'home' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s followers-only note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (3)', visibility: 'followers' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s specified-only note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (4)', visibility: 'specified', visibleUserIds: [bobInAServer.id] }, { antennaId: bobAntenna.id });
			});
		});
	});
});
