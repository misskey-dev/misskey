process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, post, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('API visibility', () => {
	let app: INestApplicationContext;

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	describe('Note visibility', () => {
		//#region vars
		/** ヒロイン */
		let alice: any;
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
		//#endregion

		const show = async (noteId: any, by: any) => {
			return await api('/notes/show', {
				noteId,
			}, by);
		};

		beforeAll(async () => {
			//#region prepare
			// signup
			alice = await signup({ username: 'alice' });
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
			//#endregion
		});

		//#region show post
		// public
		test('[show] public-postを自分が見れる', async () => {
			const res = await show(pub.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-postをフォロワーが見れる', async () => {
			const res = await show(pub.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-postを非フォロワーが見れる', async () => {
			const res = await show(pub.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-postを未認証が見れる', async () => {
			const res = await show(pub.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// home
		test('[show] home-postを自分が見れる', async () => {
			const res = await show(home.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-postをフォロワーが見れる', async () => {
			const res = await show(home.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-postを非フォロワーが見れる', async () => {
			const res = await show(home.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-postを未認証が見れる', async () => {
			const res = await show(home.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// followers
		test('[show] followers-postを自分が見れる', async () => {
			const res = await show(fol.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] followers-postをフォロワーが見れる', async () => {
			const res = await show(fol.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] followers-postを非フォロワーが見れない', async () => {
			const res = await show(fol.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] followers-postを未認証が見れない', async () => {
			const res = await show(fol.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('[show] specified-postを自分が見れる', async () => {
			const res = await show(spe.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] specified-postを指定ユーザーが見れる', async () => {
			const res = await show(spe.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] specified-postをフォロワーが見れない', async () => {
			const res = await show(spe.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-postを非フォロワーが見れない', async () => {
			const res = await show(spe.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-postを未認証が見れない', async () => {
			const res = await show(spe.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});
		//#endregion

		//#region show reply
		// public
		test('[show] public-replyを自分が見れる', async () => {
			const res = await show(pubR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-replyをされた人が見れる', async () => {
			const res = await show(pubR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-replyをフォロワーが見れる', async () => {
			const res = await show(pubR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-replyを非フォロワーが見れる', async () => {
			const res = await show(pubR.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] public-replyを未認証が見れる', async () => {
			const res = await show(pubR.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// home
		test('[show] home-replyを自分が見れる', async () => {
			const res = await show(homeR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-replyをされた人が見れる', async () => {
			const res = await show(homeR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-replyをフォロワーが見れる', async () => {
			const res = await show(homeR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-replyを非フォロワーが見れる', async () => {
			const res = await show(homeR.id, other);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] home-replyを未認証が見れる', async () => {
			const res = await show(homeR.id, null);
			assert.strictEqual(res.body.text, 'x');
		});

		// followers
		test('[show] followers-replyを自分が見れる', async () => {
			const res = await show(folR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] followers-replyを非フォロワーでもリプライされていれば見れる', async () => {
			const res = await show(folR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] followers-replyをフォロワーが見れる', async () => {
			const res = await show(folR.id, follower);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] followers-replyを非フォロワーが見れない', async () => {
			const res = await show(folR.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] followers-replyを未認証が見れない', async () => {
			const res = await show(folR.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('[show] specified-replyを自分が見れる', async () => {
			const res = await show(speR.id, alice);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] specified-replyを指定ユーザーが見れる', async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] specified-replyをされた人が指定されてなくても見れる', async () => {
			const res = await show(speR.id, target);
			assert.strictEqual(res.body.text, 'x');
		});

		test('[show] specified-replyをフォロワーが見れない', async () => {
			const res = await show(speR.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-replyを非フォロワーが見れない', async () => {
			const res = await show(speR.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-replyを未認証が見れない', async () => {
			const res = await show(speR.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});
		//#endregion

		//#region show mention
		// public
		test('[show] public-mentionを自分が見れる', async () => {
			const res = await show(pubM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] public-mentionをされた人が見れる', async () => {
			const res = await show(pubM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] public-mentionをフォロワーが見れる', async () => {
			const res = await show(pubM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] public-mentionを非フォロワーが見れる', async () => {
			const res = await show(pubM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] public-mentionを未認証が見れる', async () => {
			const res = await show(pubM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		});

		// home
		test('[show] home-mentionを自分が見れる', async () => {
			const res = await show(homeM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] home-mentionをされた人が見れる', async () => {
			const res = await show(homeM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] home-mentionをフォロワーが見れる', async () => {
			const res = await show(homeM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] home-mentionを非フォロワーが見れる', async () => {
			const res = await show(homeM.id, other);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] home-mentionを未認証が見れる', async () => {
			const res = await show(homeM.id, null);
			assert.strictEqual(res.body.text, '@target x');
		});

		// followers
		test('[show] followers-mentionを自分が見れる', async () => {
			const res = await show(folM.id, alice);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] followers-mentionをメンションされていれば非フォロワーでも見れる', async () => {
			const res = await show(folM.id, target);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] followers-mentionをフォロワーが見れる', async () => {
			const res = await show(folM.id, follower);
			assert.strictEqual(res.body.text, '@target x');
		});

		test('[show] followers-mentionを非フォロワーが見れない', async () => {
			const res = await show(folM.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] followers-mentionを未認証が見れない', async () => {
			const res = await show(folM.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});

		// specified
		test('[show] specified-mentionを自分が見れる', async () => {
			const res = await show(speM.id, alice);
			assert.strictEqual(res.body.text, '@target2 x');
		});

		test('[show] specified-mentionを指定ユーザーが見れる', async () => {
			const res = await show(speM.id, target);
			assert.strictEqual(res.body.text, '@target2 x');
		});

		test('[show] specified-mentionをされた人が指定されてなかったら見れない', async () => {
			const res = await show(speM.id, target2);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-mentionをフォロワーが見れない', async () => {
			const res = await show(speM.id, follower);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-mentionを非フォロワーが見れない', async () => {
			const res = await show(speM.id, other);
			assert.strictEqual(res.body.isHidden, true);
		});

		test('[show] specified-mentionを未認証が見れない', async () => {
			const res = await show(speM.id, null);
			assert.strictEqual(res.body.isHidden, true);
		});
		//#endregion

		//#region HTL
		test('[HTL] public-post が 自分が見れる', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, alice);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === pub.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('[HTL] public-post が 非フォロワーから見れない', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === pub.id);
			assert.strictEqual(notes.length, 0);
		});

		test('[HTL] followers-post が フォロワーから見れる', async () => {
			const res = await api('/notes/timeline', { limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === fol.id);
			assert.strictEqual(notes[0].text, 'x');
		});
		//#endregion

		//#region RTL
		test('[replies] followers-reply が フォロワーから見れる', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, follower);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('[replies] followers-reply が 非フォロワー (リプライ先ではない) から見れない', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, other);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes.length, 0);
		});

		test('[replies] followers-reply が 非フォロワー (リプライ先である) から見れる', async () => {
			const res = await api('/notes/replies', { noteId: tgt.id, limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});
		//#endregion

		//#region MTL
		test('[mentions] followers-reply が 非フォロワー (リプライ先である) から見れる', async () => {
			const res = await api('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folR.id);
			assert.strictEqual(notes[0].text, 'x');
		});

		test('[mentions] followers-mention が 非フォロワー (メンション先である) から見れる', async () => {
			const res = await api('/notes/mentions', { limit: 100 }, target);
			assert.strictEqual(res.status, 200);
			const notes = res.body.filter((n: any) => n.id === folM.id);
			assert.strictEqual(notes[0].text, '@target x');
		});
		//#endregion
	});
});

