/*
 * Tests of API (visibility)
 *
 * How to run the tests:
 * > mocha test/api-visibility.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/api-visibility.ts --require ts-node/register -g 'test name'
 */
import * as http from 'http';
import * as assert from 'chai';
import { async, _signup, _request, _uploadFile, _post, _react, resetDb } from './utils';

const expect = assert.expect;

//#region process
Error.stackTraceLimit = Infinity;

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);
//#endregion

const app = require('../built/server/api').default;
const db = require('../built/db/mongodb').default;

const server = http.createServer(app.callback());

//#region Utilities
const request = _request(server);
const signup = _signup(request);
const post = _post(request);
//#endregion

describe('API visibility', () => {
	// Reset database each test
	before(resetDb(db));

	after(() => {
		server.close();
	});

	describe('Note visibility', async () => {
		//#region vars
		/** ヒロイン */
		let alice: any;
		/** フォロワー */
		let follower: any;
		/** 非フォロワー */
		let other: any;
		/** 非フォロワーでもリプライやメンションをされた人 */
		let target: any;

		/** public-post */
		let pub: any;
		/** home-post */
		let home: any;
		/** followers-post */
		let fol: any;
		/** specified-post */
		let spe: any;
		/** private-post */
		let pri: any;

		/** public-reply to target's post */
		let pubR: any;
		/** home-reply to target's post */
		let homeR: any;
		/** followers-reply to target's post */
		let folR: any;
		/** specified-reply to target's post */
		let speR: any;
		/** private-reply to target's post */
		let priR: any;

		/** public-mention to target */
		let pubM: any;
		/** home-mention to target */
		let homeM: any;
		/** followers-mention to target */
		let folM: any;
		/** specified-mention to target */
		let speM: any;
		/** private-mention to target */
		let priM: any;

		/** reply target post */
		let tgt: any;
		//#endregion

		const show = async (noteId: any, by: any) => {
			return await request('/notes/show', {
				noteId
			}, by);
		};

		before(async () => {
			//#region prepare
			// signup
			alice    = await signup({ username: 'alice' });
			follower = await signup({ username: 'follower' });
			other    = await signup({ username: 'other' });
			target   = await signup({ username: 'target' });

			// follow alice <= follower
			await request('/following/create', { userId: alice.id }, follower);

			// normal posts
			pub  = await post(alice, { text: 'x', visibility: 'public' });
			home = await post(alice, { text: 'x', visibility: 'home' });
			fol  = await post(alice, { text: 'x', visibility: 'followers' });
			spe  = await post(alice, { text: 'x', visibility: 'specified', visibleUserIds: [target.id] });
			pri  = await post(alice, { text: 'x', visibility: 'private' });

			// replies
			tgt = await post(target, { text: 'y', visibility: 'public' });
			pubR  = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'public' });
			homeR = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'home' });
			folR  = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'followers' });
			speR  = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'specified' });
			priR  = await post(alice, { text: 'x', replyId: tgt.id, visibility: 'private' });

			// mentions
			pubM  = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'public' });
			homeM = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'home' });
			folM  = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'followers' });
			speM  = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'specified' });
			priM  = await post(alice, { text: '@target x', replyId: tgt.id, visibility: 'private' });
			//#endregion
		});

		//#region show post
		// public
		it('[show] public-postを自分が見れる', async(async () => {
			const res = await show(pub.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-postをフォロワーが見れる', async(async () => {
			const res = await show(pub.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-postを非フォロワーが見れる', async(async () => {
			const res = await show(pub.id, other);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-postを未認証が見れる', async(async () => {
			const res = await show(pub.id, null);
			expect(res.body).have.property('text').eql('x');
		}));

		// home
		it('[show] home-postを自分が見れる', async(async () => {
			const res = await show(home.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-postをフォロワーが見れる', async(async () => {
			const res = await show(home.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-postを非フォロワーが見れる', async(async () => {
			const res = await show(home.id, other);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-postを未認証が見れる', async(async () => {
			const res = await show(home.id, null);
			expect(res.body).have.property('text').eql('x');
		}));

		// followers
		it('[show] followers-postを自分が見れる', async(async () => {
			const res = await show(fol.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] followers-postをフォロワーが見れる', async(async () => {
			const res = await show(fol.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] followers-postを非フォロワーが見れない', async(async () => {
			const res = await show(fol.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] followers-postを未認証が見れない', async(async () => {
			const res = await show(fol.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// specified
		it('[show] specified-postを自分が見れる', async(async () => {
			const res = await show(spe.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] specified-postを指定ユーザーが見れる', async(async () => {
			const res = await show(spe.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] specified-postをフォロワーが見れない', async(async () => {
			const res = await show(spe.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-postを非フォロワーが見れない', async(async () => {
			const res = await show(spe.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-postを未認証が見れない', async(async () => {
			const res = await show(spe.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// private
		it('[show] private-postを自分が見れる', async(async () => {
			const res = await show(pri.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] private-postをフォロワーが見れない', async(async () => {
			const res = await show(pri.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-postを非フォロワーが見れない', async(async () => {
			const res = await show(pri.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-postを未認証が見れない', async(async () => {
			const res = await show(pri.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));
		//#endregion

		//#region show reply
		// public
		it('[show] public-replyを自分が見れる', async(async () => {
			const res = await show(pubR.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-replyをされた人が見れる', async(async () => {
			const res = await show(pubR.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-replyをフォロワーが見れる', async(async () => {
			const res = await show(pubR.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-replyを非フォロワーが見れる', async(async () => {
			const res = await show(pubR.id, other);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] public-replyを未認証が見れる', async(async () => {
			const res = await show(pubR.id, null);
			expect(res.body).have.property('text').eql('x');
		}));

		// home
		it('[show] home-replyを自分が見れる', async(async () => {
			const res = await show(homeR.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-replyをされた人が見れる', async(async () => {
			const res = await show(homeR.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-replyをフォロワーが見れる', async(async () => {
			const res = await show(homeR.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-replyを非フォロワーが見れる', async(async () => {
			const res = await show(homeR.id, other);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] home-replyを未認証が見れる', async(async () => {
			const res = await show(homeR.id, null);
			expect(res.body).have.property('text').eql('x');
		}));

		// followers
		it('[show] followers-replyを自分が見れる', async(async () => {
			const res = await show(folR.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] followers-replyを非フォロワーでもリプライされていれば見れる', async(async () => {
			const res = await show(folR.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] followers-replyをフォロワーが見れる', async(async () => {
			const res = await show(folR.id, follower);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] followers-replyを非フォロワーが見れない', async(async () => {
			const res = await show(folR.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] followers-replyを未認証が見れない', async(async () => {
			const res = await show(folR.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// specified
		it('[show] specified-replyを自分が見れる', async(async () => {
			const res = await show(speR.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] specified-replyを指定ユーザーが見れる', async(async () => {
			const res = await show(speR.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] specified-replyをされた人が指定されてなくても見れる', async(async () => {
			const res = await show(speR.id, target);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] specified-replyをフォロワーが見れない', async(async () => {
			const res = await show(speR.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-replyを非フォロワーが見れない', async(async () => {
			const res = await show(speR.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-replyを未認証が見れない', async(async () => {
			const res = await show(speR.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// private
		it('[show] private-replyを自分が見れる', async(async () => {
			const res = await show(priR.id, alice);
			expect(res.body).have.property('text').eql('x');
		}));

		it('[show] private-replyをフォロワーが見れない', async(async () => {
			const res = await show(priR.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-replyを非フォロワーが見れない', async(async () => {
			const res = await show(priR.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-replyを未認証が見れない', async(async () => {
			const res = await show(priR.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));
		//#endregion

		//#region show mention
		// public
		it('[show] public-mentionを自分が見れる', async(async () => {
			const res = await show(pubM.id, alice);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] public-mentionをされた人が見れる', async(async () => {
			const res = await show(pubM.id, target);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] public-mentionをフォロワーが見れる', async(async () => {
			const res = await show(pubM.id, follower);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] public-mentionを非フォロワーが見れる', async(async () => {
			const res = await show(pubM.id, other);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] public-mentionを未認証が見れる', async(async () => {
			const res = await show(pubM.id, null);
			expect(res.body).have.property('text').eql('@target x');
		}));

		// home
		it('[show] home-mentionを自分が見れる', async(async () => {
			const res = await show(homeM.id, alice);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] home-mentionをされた人が見れる', async(async () => {
			const res = await show(homeM.id, target);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] home-mentionをフォロワーが見れる', async(async () => {
			const res = await show(homeM.id, follower);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] home-mentionを非フォロワーが見れる', async(async () => {
			const res = await show(homeM.id, other);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] home-mentionを未認証が見れる', async(async () => {
			const res = await show(homeM.id, null);
			expect(res.body).have.property('text').eql('@target x');
		}));

		// followers
		it('[show] followers-mentionを自分が見れる', async(async () => {
			const res = await show(folM.id, alice);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] followers-mentionを非フォロワーでもメンションされていれば見れる', async(async () => {
			const res = await show(folM.id, target);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] followers-mentionをフォロワーが見れる', async(async () => {
			const res = await show(folM.id, follower);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] followers-mentionを非フォロワーが見れない', async(async () => {
			const res = await show(folM.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] followers-mentionを未認証が見れない', async(async () => {
			const res = await show(folM.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// specified
		it('[show] specified-mentionを自分が見れる', async(async () => {
			const res = await show(speM.id, alice);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] specified-mentionを指定ユーザーが見れる', async(async () => {
			const res = await show(speM.id, target);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] specified-mentionをされた人が指定されてなくても見れる', async(async () => {
			const res = await show(speM.id, target);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] specified-mentionをフォロワーが見れない', async(async () => {
			const res = await show(speM.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-mentionを非フォロワーが見れない', async(async () => {
			const res = await show(speM.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] specified-mentionを未認証が見れない', async(async () => {
			const res = await show(speM.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		// private
		it('[show] private-mentionを自分が見れる', async(async () => {
			const res = await show(priM.id, alice);
			expect(res.body).have.property('text').eql('@target x');
		}));

		it('[show] private-mentionをフォロワーが見れない', async(async () => {
			const res = await show(priM.id, follower);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-mentionを非フォロワーが見れない', async(async () => {
			const res = await show(priM.id, other);
			expect(res.body).have.property('isHidden').eql(true);
		}));

		it('[show] private-mentionを未認証が見れない', async(async () => {
			const res = await show(priM.id, null);
			expect(res.body).have.property('isHidden').eql(true);
		}));
		//#endregion

		//#region HTL
		it('[HTL] public-post が 自分が見れる', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, alice);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == pub.id);
			expect(notes[0]).have.property('text').eql('x');
		}));

		it('[HTL] public-post が 非フォロワーから見れない', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, other);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == pub.id);
			expect(notes).length(0);
		}));

		it('[HTL] followers-post が フォロワーから見れる', async(async () => {
			const res = await request('/notes/timeline', { limit: 100 }, follower);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == fol.id);
			expect(notes[0]).have.property('text').eql('x');
		}));
		//#endregion

		//#region RTL
		it('[replies] followers-reply が フォロワーから見れる', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, follower);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			expect(notes[0]).have.property('text').eql('x');
		}));

		it('[replies] followers-reply が 非フォロワー (リプライ先ではない) から見れない', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, other);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			expect(notes).length(0);
		}));

		it('[replies] followers-reply が 非フォロワー (リプライ先である) から見れる', async(async () => {
			const res = await request('/notes/replies', { noteId: tgt.id, limit: 100 }, target);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			expect(notes[0]).have.property('text').eql('x');
		}));
		//#endregion

		//#region MTL
		it('[mentions] followers-reply が 非フォロワー (リプライ先である) から見れる', async(async () => {
			const res = await request('/notes/mentions', { limit: 100 }, target);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == folR.id);
			expect(notes[0]).have.property('text').eql('x');
		}));

		it('[mentions] followers-mention が 非フォロワー (メンション先である) から見れる', async(async () => {
			const res = await request('/notes/mentions', { limit: 100 }, target);
			expect(res).have.status(200);
			const notes = res.body.filter((n: any) => n.id == folM.id);
			expect(notes[0]).have.property('text').eql('@target x');
		}));
		//#endregion
	});
});
