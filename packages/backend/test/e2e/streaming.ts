/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { WebSocket } from 'ws';
import { MiFollowing } from '@/models/Following.js';
import { api, createAppToken, initTestDb, port, post, signup, waitFire } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Streaming', () => {
	let Followings: any;

	const follow = async (follower: any, followee: any) => {
		await Followings.save({
			id: 'a',
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
		let ayano: misskey.entities.SignupResponse;
		let kyoko: misskey.entities.SignupResponse;
		let chitose: misskey.entities.SignupResponse;
		let kanako: misskey.entities.SignupResponse;

		// Remote users
		let akari: misskey.entities.SignupResponse;
		let chinatsu: misskey.entities.SignupResponse;
		let takumi: misskey.entities.SignupResponse;

		let kyokoNote: misskey.entities.Note;
		let kanakoNote: misskey.entities.Note;
		let takumiNote: misskey.entities.Note;
		let list: any;

		beforeAll(async () => {
			const connection = await initTestDb(true);
			Followings = connection.getRepository(MiFollowing);

			ayano = await signup({ username: 'ayano' });
			kyoko = await signup({ username: 'kyoko' });
			chitose = await signup({ username: 'chitose' });
			kanako = await signup({ username: 'kanako' });

			akari = await signup({ username: 'akari', host: 'example.com' });
			chinatsu = await signup({ username: 'chinatsu', host: 'example.com' });
			takumi = await signup({ username: 'takumi', host: 'example.com' });

			kyokoNote = await post(kyoko, { text: 'foo' });
			kanakoNote = await post(kanako, { text: 'hoge' });
			takumiNote = await post(takumi, { text: 'piyo' });

			// Follow: ayano => kyoko
			await api('following/create', { userId: kyoko.id, withReplies: false }, ayano);

			// Follow: ayano => akari
			await follow(ayano, akari);

			// Follow: kyoko => chitose
			await api('following/create', { userId: chitose.id }, kyoko);

			// Mute: chitose => kanako
			await api('mute/create', { userId: kanako.id }, chitose);

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

			await api('users/lists/push', {
				listId: list.id,
				userId: takumi.id,
			}, chitose);
		}, 1000 * 60 * 2);

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

			test('自分の visibility: followers な投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:Home
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, ayano),	// ayano posts
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

			test('フォローしているユーザーの visibility: followers な投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',		// ayano:home
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしているユーザーの visibility: followers な投稿への返信が流れる', async () => {
				const note = await post(kyoko, { text: 'foo', visibility: 'followers' });

				const fired = await waitFire(
					ayano, 'homeTimeline',		// ayano:home
					() => api('notes/create', { text: 'bar', visibility: 'followers', replyId: note.id }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id && msg.body.reply.text === 'foo',
				);

				assert.strictEqual(fired, true);
			});

			test('フォローしているユーザーのフォローしていないユーザーの visibility: followers な投稿への返信が流れない', async () => {
				const chitoseNote = await post(chitose, { text: 'followers-only post', visibility: 'followers' });

				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'reply to chitose\'s followers-only post', replyId: chitoseNote.id }, kyoko),	// kyoko's reply to chitose's followers-only post
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
			});

			test('フォローしているユーザーのフォローしていないユーザーの visibility: followers な投稿への返信のリノートが流れない', async () => {
				const chitoseNote = await post(chitose, { text: 'followers-only post', visibility: 'followers' });
				const kyokoReply = await post(kyoko, { text: 'reply to followers-only post', replyId: chitoseNote.id });

				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { renoteId: kyokoReply.id }, kyoko),	// kyoko's renote of kyoko's reply to chitose's followers-only post
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, false);
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

			/**
			 * TODO: 落ちる
			 * @see https://github.com/misskey-dev/misskey/issues/13474
			test('visibility: specified なノートで visibleUserIds に自分が含まれているときそのノートへのリプライが流れてくる', async () => {
				const chitoseToKyokoAndAyano = await post(chitose, { text: 'direct note from chitose to kyoko and ayano', visibility: 'specified', visibleUserIds: [kyoko.id, ayano.id] });

				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'direct reply from kyoko to chitose and ayano', replyId: chitoseToKyokoAndAyano.id, visibility: 'specified', visibleUserIds: [chitose.id, ayano.id] }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
				);

				assert.strictEqual(fired, true);
			});
			 */

			test('visibility: specified な投稿に対するリプライで visibleUserIds が拡張されたとき、その拡張されたユーザーの HTL にはそのリプライが流れない', async () => {
				const chitoseToKyoko = await post(chitose, { text: 'direct note from chitose to kyoko', visibility: 'specified', visibleUserIds: [kyoko.id] });

				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'direct reply from kyoko to chitose and ayano', replyId: chitoseToKyoko.id, visibility: 'specified', visibleUserIds: [chitose.id, ayano.id] }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
				);

				assert.strictEqual(fired, false);
			});

			test('visibility: specified な投稿に対するリプライで visibleUserIds が収縮されたとき、その収縮されたユーザーの HTL にはそのリプライが流れない', async () => {
				const chitoseToKyokoAndAyano = await post(chitose, { text: 'direct note from chitose to kyoko and ayano', visibility: 'specified', visibleUserIds: [kyoko.id, ayano.id] });

				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'direct reply from kyoko to chitose', replyId: chitoseToKyokoAndAyano.id, visibility: 'specified', visibleUserIds: [chitose.id] }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
				);

				assert.strictEqual(fired, false);
			});

			test('withRenotes: false のときリノートが流れない', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { renoteId: kyokoNote.id }, kyoko),	// kyoko renote
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
					{ withRenotes: false },
				);

				assert.strictEqual(fired, false);
			});

			test('withRenotes: false のとき引用リノートが流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { text: 'quote', renoteId: kyokoNote.id }, kyoko),	// kyoko quote
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
					{ withRenotes: false },
				);

				assert.strictEqual(fired, true);
			});

			test('withRenotes: false のとき投票のみのリノートが流れる', async () => {
				const fired = await waitFire(
					ayano, 'homeTimeline',	// ayano:home
					() => api('notes/create', { poll: { choices: ['kinoko', 'takenoko'] }, renoteId: kyokoNote.id }, kyoko),	// kyoko renote with poll
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
					{ withRenotes: false },
				);

				assert.strictEqual(fired, true);
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

			test('自分の visibility: followers な投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, ayano),	// ayano posts
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

			test('フォローしているユーザーの visibility: followers な投稿が流れる', async () => {
				const fired = await waitFire(
					ayano, 'hybridTimeline',	// ayano:Hybrid
					() => api('notes/create', { text: 'foo', visibility: 'followers' }, kyoko),
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

			test('withReplies = falseでフォローしてる人によるリプライが流れてくる', async () => {
				const fired = await waitFire(
					ayano, 'globalTimeline',		// ayano:Global
					() => api('notes/create', { text: 'foo', replyId: kanakoNote.id }, kyoko),	// kyoko posts
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,	// wait kyoko
				);

				assert.strictEqual(fired, true);
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

			// #10443
			test('チャンネル投稿は流れない', async () => {
				// リスインしている kyoko が 任意のチャンネルに投降した時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo', channelId: 'dummy' }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #10443
			test('ミュートしているユーザへのリプライがリストTLに流れない', async () => {
				// chitose が kanako をミュートしている状態で、リスインしている kyoko が kanako にリプライした時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo', replyId: kanakoNote.id }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #10443
			test('ミュートしているユーザの投稿をリノートしたときリストTLに流れない', async () => {
				// chitose が kanako をミュートしている状態で、リスインしている kyoko が kanako のノートをリノートした時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { renoteId: kanakoNote.id }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #10443
			test('ミュートしているサーバのノートがリストTLに流れない', async () => {
				await api('i/update', {
					mutedInstances: ['example.com'],
				}, chitose);

				// chitose が example.com をミュートしている状態で、リスインしている takumi が ノートした時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo' }, takumi),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #10443
			test('ミュートしているサーバのノートに対するリプライがリストTLに流れない', async () => {
				await api('i/update', {
					mutedInstances: ['example.com'],
				}, chitose);

				// chitose が example.com をミュートしている状態で、リスインしている kyoko が takumi のノートにリプライした時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { text: 'foo', replyId: takumiNote.id }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});

			// #10443
			test('ミュートしているサーバのノートに対するリノートがリストTLに流れない', async () => {
				await api('i/update', {
					mutedInstances: ['example.com'],
				}, chitose);

				// chitose が example.com をミュートしている状態で、リスインしている kyoko が takumi のノートをリノートした時の動きを見たい
				const fired = await waitFire(
					chitose, 'userList',
					() => api('notes/create', { renoteId: takumiNote.id }, kyoko),
					msg => msg.type === 'note' && msg.body.userId === kyoko.id,
					{ listId: list.id },
				);

				assert.strictEqual(fired, false);
			});
		});

		test('Authentication', async () => {
			const application = await createAppToken(ayano, []);
			const application2 = await createAppToken(ayano, ['read:account']);
			const socket = new WebSocket(`ws://127.0.0.1:${port}/streaming?i=${application}`);
			const established = await new Promise<boolean>((resolve, reject) => {
				socket.on('error', () => resolve(false));
				socket.on('unexpected-response', () => resolve(false));
				setTimeout(() => resolve(true), 3000);
			});

			socket.close();
			assert.strictEqual(established, false);

			const fired = await waitFire(
				{ token: application2 }, 'hybridTimeline',
				() => api('notes/create', { text: 'Hello, world!' }, ayano),
				msg => msg.type === 'note' && msg.body.userId === ayano.id,
			);

			assert.strictEqual(fired, true);
		});

		// XXX: QueryFailedError: duplicate key value violates unique constraint "IDX_347fec870eafea7b26c8a73bac"
		/*
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
		*/
	});
});
