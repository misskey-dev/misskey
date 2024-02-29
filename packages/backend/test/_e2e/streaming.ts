process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { Following } from '../../src/models/entities/following.js';
import { connectStream, signup, api, post, startServer, shutdownServer, initTestDb, waitFire } from '../utils.js';

describe('Streaming', () => {
	let p: childProcess.ChildProcess;
	let Followings: any;

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

	describe('Streaming', () => {
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
			p = await startServer();
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
		}, 1000 * 30);

		afterAll(async () => {
			await shutdownServer(p);
		});

		describe('Events', () => {
			test('mention event', async () => {
				const fired = await waitFire(
					kyoko, 'main',	// kyoko:main
					() => post(ayano, { text: 'foo @kyoko bar' }),	// ayano mention => kyoko
					msg => msg.type === 'mention' && msg.body.userId === ayano.id,	// wait ayano
				);

				assert.strictEqual(fired, true);
			});

			test('renote event', async () => {
				const fired = await waitFire(
					kyoko, 'main',	// kyoko:main
					() => post(ayano, { renoteId: kyokoNote.id }),	// ayano renote
					msg => msg.type === 'renote' && msg.body.renoteId === kyokoNote.id,	// wait renote
				);

				assert.strictEqual(fired, true);
			});
		});

		describe('Home Timeline', () => {
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
		});	// Home

		describe('Local Timeline', () => {
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
		});

		describe('Hybrid Timeline', () => {
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

		describe('Global Timeline', () => {
			test('フォローしていないローカルユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',	// ayano:Global
					() => api('notes/create', { text: 'foo' }, chitose),	// chitose posts
					msg => msg.type === 'note' && msg.body.userId === chitose.id,	// wait chitose
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしていないリモートユーザーの投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',	// ayano:Global
					() => api('notes/create', { text: 'foo' }, chinatsu),	// chinatsu posts
					msg => msg.type === 'note' && msg.body.userId === chinatsu.id,	// wait chinatsu
				);

				assert.strictEqual(fired, true);
			});

			test('ホーム投稿は流れない', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',	// ayano:Global
					() => api('notes/create', { text: 'foo', visibility: 'home' }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});
		});

		describe('UserList Timeline', () => {
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

		describe('Hashtag Timeline', () => {
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
	});
});
