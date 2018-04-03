/**
 * API TESTS
 */

import * as merge from 'object-assign-deep';

Error.stackTraceLimit = Infinity;

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);

const fs = require('fs');
const _chai = require('chai');
const chaiHttp = require('chai-http');
const should = _chai.should();

_chai.use(chaiHttp);

const server = require('../built/server/api');
const db = require('../built/db/mongodb').default;

const async = fn => (done) => {
	fn().then(() => {
		done();
	}, err => {
		done(err);
	});
};

const request = (endpoint, params, me?) => new Promise<any>((ok, ng) => {
	const auth = me ? {
		i: me.account.token
	} : {};

	_chai.request(server)
		.post(endpoint)
		.send(Object.assign(auth, params))
		.end((err, res) => {
			ok(res);
		});
});

describe('API', () => {
	// Reset database each test
	beforeEach(() => Promise.all([
		db.get('users').drop(),
		db.get('posts').drop(),
		db.get('driveFiles.files').drop(),
		db.get('driveFiles.chunks').drop(),
		db.get('driveFolders').drop(),
		db.get('apps').drop(),
		db.get('accessTokens').drop(),
		db.get('authSessions').drop()
	]));

	it('greet server', done => {
		_chai.request(server)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.text.should.be.equal('YEE HAW');
				done();
			});
	});

	describe('signup', () => {
		it('不正なユーザー名でアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'sakurako.',
				password: 'HimawariDaisuki06160907'
			});
			res.should.have.status(400);
		}));

		it('空のパスワードでアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'sakurako',
				password: ''
			});
			res.should.have.status(400);
		}));

		it('正しくアカウントが作成できる', async(async () => {
			const me = {
				username: 'sakurako',
				password: 'HimawariDaisuki06160907'
			};
			const res = await request('/signup', me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('username').eql(me.username);
		}));

		it('同じユーザー名のアカウントは作成できない', async(async () => {
			const user = await insertSakurako();
			const res = await request('/signup', {
				username: user.username,
				password: 'HimawariDaisuki06160907'
			});
			res.should.have.status(400);
		}));
	});

	describe('signin', () => {
		it('間違ったパスワードでサインインできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/signin', {
				username: me.username,
				password: 'kyoppie'
			});
			res.should.have.status(400);
		}));

		it('クエリをインジェクションできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/signin', {
				username: me.username,
				password: {
					$gt: ''
				}
			});
			res.should.have.status(400);
		}));

		it('正しい情報でサインインできる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/signin', {
				username: me.username,
				password: 'HimawariDaisuki06160907'
			});
			res.should.have.status(204);
		}));
	});

	describe('i/update', () => {
		it('アカウント設定を更新できる', async(async () => {
			const me = await insertSakurako({
				account: {
					profile: {
						gender: 'female'
					}
				}
			});

			const myName = '大室櫻子';
			const myLocation = '七森中';
			const myBirthday = '2000-09-07';

			const res = await request('/i/update', {
				name: myName,
				location: myLocation,
				birthday: myBirthday
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('name').eql(myName);
			res.body.should.have.nested.property('account.profile').a('object');
			res.body.should.have.nested.property('account.profile.location').eql(myLocation);
			res.body.should.have.nested.property('account.profile.birthday').eql(myBirthday);
			res.body.should.have.nested.property('account.profile.gender').eql('female');
		}));

		it('名前を空白にできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/i/update', {
				name: ' '
			}, me);
			res.should.have.status(400);
		}));

		it('誕生日の設定を削除できる', async(async () => {
			const me = await insertSakurako({
				birthday: '2000-09-07'
			});
			const res = await request('/i/update', {
				birthday: null
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.nested.property('account.profile').a('object');
			res.body.should.have.nested.property('account.profile.birthday').eql(null);
		}));

		it('不正な誕生日の形式で怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/i/update', {
				birthday: '2000/09/07'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('users/show', () => {
		it('ユーザーが取得できる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/users/show', {
				userId: me._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('id').eql(me._id.toString());
		}));

		it('ユーザーが存在しなかったら怒る', async(async () => {
			const res = await request('/users/show', {
				userId: '000000000000000000000000'
			});
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/users/show', {
				userId: 'kyoppie'
			});
			res.should.have.status(400);
		}));
	});

	describe('posts/create', () => {
		it('投稿できる', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: 'ひまわりー'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('text').eql(post.text);
		}));

		it('ファイルを添付できる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id
			});
			const res = await request('/posts/create', {
				mediaIds: [file._id.toString()]
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('mediaIds').eql([file._id.toString()]);
		}));

		it('他人のファイルは添付できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				userId: hima._id
			});
			const res = await request('/posts/create', {
				mediaIds: [file._id.toString()]
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないファイルは添付できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				mediaIds: ['000000000000000000000000']
			}, me);
			res.should.have.status(400);
		}));

		it('不正なファイルIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				mediaIds: ['kyoppie']
			}, me);
			res.should.have.status(400);
		}));

		it('返信できる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const post = {
				text: 'さく',
				replyId: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('text').eql(post.text);
			res.body.createdPost.should.have.property('replyId').eql(post.replyId);
			res.body.createdPost.should.have.property('reply');
			res.body.createdPost.reply.should.have.property('text').eql(himaPost.text);
		}));

		it('repostできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'こらっさくらこ！'
			});

			const me = await insertSakurako();
			const post = {
				repostId: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('repostId').eql(post.repostId);
			res.body.createdPost.should.have.property('repost');
			res.body.createdPost.repost.should.have.property('text').eql(himaPost.text);
		}));

		it('引用repostできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'こらっさくらこ！'
			});

			const me = await insertSakurako();
			const post = {
				text: 'さく',
				repostId: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('text').eql(post.text);
			res.body.createdPost.should.have.property('repostId').eql(post.repostId);
			res.body.createdPost.should.have.property('repost');
			res.body.createdPost.repost.should.have.property('text').eql(himaPost.text);
		}));

		it('文字数ぎりぎりで怒られない', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: '!'.repeat(1000)
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
		}));

		it('文字数オーバーで怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: '!'.repeat(1001)
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('存在しないリプライ先で怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: 'さく',
				replyId: '000000000000000000000000'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('存在しないrepost対象で怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				repostId: '000000000000000000000000'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('不正なリプライ先IDで怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: 'さく',
				replyId: 'kyoppie'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('不正なrepost対象IDで怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				repostId: 'kyoppie'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('投票を添付できる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				text: 'インデントするなら？',
				poll: {
					choices: ['スペース', 'タブ']
				}
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('createdPost');
			res.body.createdPost.should.have.property('poll');
		}));

		it('投票の選択肢が無くて怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				poll: {}
			}, me);
			res.should.have.status(400);
		}));

		it('投票の選択肢が無くて怒られる (空の配列)', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				poll: {
					choices: []
				}
			}, me);
			res.should.have.status(400);
		}));

		it('投票の選択肢が1つで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				poll: {
					choices: ['Strawberry Pasta']
				}
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('posts/show', () => {
		it('投稿が取得できる', async(async () => {
			const me = await insertSakurako();
			const myPost = await db.get('posts').insert({
				userId: me._id,
				text: 'お腹ペコい'
			});
			const res = await request('/posts/show', {
				postId: myPost._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('id').eql(myPost._id.toString());
		}));

		it('投稿が存在しなかったら怒る', async(async () => {
			const res = await request('/posts/show', {
				postId: '000000000000000000000000'
			});
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/posts/show', {
				postId: 'kyoppie'
			});
			res.should.have.status(400);
		}));
	});

	describe('posts/reactions/create', () => {
		it('リアクションできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {
				postId: himaPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(204);
		}));

		it('自分の投稿にはリアクションできない', async(async () => {
			const me = await insertSakurako();
			const myPost = await db.get('posts').insert({
				userId: me._id,
				text: 'お腹ペコい'
			});

			const res = await request('/posts/reactions/create', {
				postId: myPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));

		it('二重にリアクションできない', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('postReactions').insert({
				userId: me._id,
				postId: himaPost._id,
				reaction: 'like'
			});

			const res = await request('/posts/reactions/create', {
				postId: himaPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない投稿にはリアクションできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {
				postId: '000000000000000000000000',
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {
				postId: 'kyoppie',
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('posts/reactions/delete', () => {
		it('リアクションをキャンセルできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('postReactions').insert({
				userId: me._id,
				postId: himaPost._id,
				reaction: 'like'
			});

			const res = await request('/posts/reactions/delete', {
				postId: himaPost._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('リアクションしていない投稿はリアクションをキャンセルできない', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				userId: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {
				postId: himaPost._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない投稿はリアクションをキャンセルできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {
				postId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {
				postId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('following/create', () => {
		it('フォローできる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			const res = await request('/following/create', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('既にフォローしている場合は怒る', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followeeId: hima._id,
				followerId: me._id
			});
			const res = await request('/following/create', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーはフォローできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {
				userId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('自分自身はフォローできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {
				userId: me._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {
				userId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('following/delete', () => {
		it('フォロー解除できる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followeeId: hima._id,
				followerId: me._id
			});
			const res = await request('/following/delete', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('過去にフォロー歴があった状態でフォロー解除できる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followeeId: hima._id,
				followerId: me._id,
				deletedAt: new Date()
			});
			await db.get('following').insert({
				followeeId: hima._id,
				followerId: me._id
			});
			const res = await request('/following/delete', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('フォローしていない場合は怒る', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーはフォロー解除できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				userId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('自分自身はフォロー解除できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				userId: me._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				userId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('drive', () => {
		it('ドライブ情報を取得できる', async(async () => {
			const me = await insertSakurako();
			await insertDriveFile({
				userId: me._id,
				datasize: 256
			});
			await insertDriveFile({
				userId: me._id,
				datasize: 512
			});
			await insertDriveFile({
				userId: me._id,
				datasize: 1024
			});
			const res = await request('/drive', {}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('usage').eql(1792);
		}));
	});

	describe('drive/files/create', () => {
		it('ファイルを作成できる', async(async () => {
			const me = await insertSakurako();
			const res = await _chai.request(server)
				.post('/drive/files/create')
				.field('i', me.account.token)
				.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('name').eql('Lenna.png');
		}));

		it('ファイル無しで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/files/create', {}, me);
			res.should.have.status(400);
		}));
	});

	describe('drive/files/update', () => {
		it('名前を更新できる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id
			});
			const newName = 'いちごパスタ.png';
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				name: newName
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('name').eql(newName);
		}));

		it('他人のファイルは更新できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				userId: hima._id
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				name: 'いちごパスタ.png'
			}, me);
			res.should.have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id
			});
			const folder = await insertDriveFolder({
				userId: me._id
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				folderId: folder._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('folderId').eql(folder._id.toString());
		}));

		it('親フォルダを無しにできる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id,
				folderId: '000000000000000000000000'
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				folderId: null
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('folderId').eql(null);
		}));

		it('他人のフォルダには入れられない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				userId: me._id
			});
			const folder = await insertDriveFolder({
				userId: hima._id
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				folderId: folder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないフォルダで怒られる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				folderId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				userId: me._id
			});
			const res = await request('/drive/files/update', {
				fileId: file._id.toString(),
				folderId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));

		it('ファイルが存在しなかったら怒る', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/files/update', {
				fileId: '000000000000000000000000',
				name: 'いちごパスタ.png'
			}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/files/update', {
				fileId: 'kyoppie',
				name: 'いちごパスタ.png'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('drive/folders/create', () => {
		it('フォルダを作成できる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/folders/create', {
				name: 'my folder'
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('name').eql('my folder');
		}));
	});

	describe('drive/folders/update', () => {
		it('名前を更新できる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				userId: me._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				name: 'new name'
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('name').eql('new name');
		}));

		it('他人のフォルダを更新できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const folder = await insertDriveFolder({
				userId: hima._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				name: 'new name'
			}, me);
			res.should.have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				userId: me._id
			});
			const parentFolder = await insertDriveFolder({
				userId: me._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: parentFolder._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('parentId').eql(parentFolder._id.toString());
		}));

		it('親フォルダを無しに更新できる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				userId: me._id,
				parentId: '000000000000000000000000'
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: null
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('parentId').eql(null);
		}));

		it('他人のフォルダを親フォルダに設定できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const folder = await insertDriveFolder({
				userId: me._id
			});
			const parentFolder = await insertDriveFolder({
				userId: hima._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: parentFolder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('フォルダが循環するような構造にできない', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const parentFolder = await insertDriveFolder({
				parentId: folder._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: parentFolder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('フォルダが循環するような構造にできない(再帰的)', async(async () => {
			const me = await insertSakurako();
			const folderA = await insertDriveFolder();
			const folderB = await insertDriveFolder({
				parentId: folderA._id
			});
			const folderC = await insertDriveFolder({
				parentId: folderB._id
			});
			const res = await request('/drive/folders/update', {
				folderId: folderA._id.toString(),
				parentId: folderC._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない親フォルダを設定できない', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正な親フォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const res = await request('/drive/folders/update', {
				folderId: folder._id.toString(),
				parentId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないフォルダを更新できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/folders/update', {
				folderId: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/folders/update', {
				folderId: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('messaging/messages/create', () => {
		it('メッセージを送信できる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				userId: hima._id.toString(),
				text: 'Hey hey ひまわり'
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('text').eql('Hey hey ひまわり');
		}));

		it('自分自身にはメッセージを送信できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				userId: me._id.toString(),
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーにはメッセージを送信できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				userId: '000000000000000000000000',
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なユーザーIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				userId: 'kyoppie',
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('テキストが無くて怒られる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				userId: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('文字数オーバーで怒られる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				userId: hima._id.toString(),
				text: '!'.repeat(1001)
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('auth/session/generate', () => {
		it('認証セッションを作成できる', async(async () => {
			const app = await insertApp();
			const res = await request('/auth/session/generate', {
				appSecret: app.secret
			});
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('token');
			res.body.should.have.property('url');
		}));

		it('appSecret 無しで怒られる', async(async () => {
			const res = await request('/auth/session/generate', {});
			res.should.have.status(400);
		}));

		it('誤った appSecret で怒られる', async(async () => {
			const res = await request('/auth/session/generate', {
				appSecret: 'kyoppie'
			});
			res.should.have.status(400);
		}));
	});
});

function insertSakurako(opts?) {
	return db.get('users').insert(merge({
		username: 'sakurako',
		usernameLower: 'sakurako',
		account: {
			keypair: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAtdTG9rlFWjNqhgbg2V6X5XF1WpQXZS3KNXykEWl2UAiMyfVV\nBvf3zQP0dDEdNtcqdPJgis03bpiHCzQusc/YLyHYB0m+TJXsxJatb8cqUogOFeE4\ngQ4Dc5kAT6gLh/d4yz03EIg9bizX07EiGWnZqWxb+21ypqsPxST64sAtG9f5O/G4\nXe2m3cSbfAAvEUP1Ig1LUNyJB4jhM60w1cQic/qO8++sk/+GoX9g71X+i4NArGv+\n1c11acDIIPGAAQpFeYVeGaKakNDNp8RtJJp8R8FLwJXZ4/gATBnScCiHUSrGfRly\nYyR0w/BNlQ6/NijAdB9pR5csPvyIPkx1gauZewIDAQABAoIBAQCwWf/mhuY2h6uG\n9eDZsZ7Mj2/sO7k9Dl4R5iMSKCDxmnlB3slqitExa+aJUqEs8R5icjkkJcjfYNuJ\nCEFJf3YCsGZfGyyQBtCuEh2ATcBEb2SJ3/f3YuoCEaB1oVwdsOzc4TAovpol4yQo\nUqHp1/mdElVb01jhQQN4h1c02IJnfzvfU1C8szBni+Etfd+MxqGfv006DY3KOEb3\nlCrCS3GmooJW2Fjj7q1kCcaEQbMB1/aQHLXd1qe3KJOzXh3Voxsp/jEH0hvp2TII\nfY9UK+b7mA+xlvXwKuTkHVaZm0ylg0nbembS8MF4GfFMujinSexvLrVKaQhdMFoF\nvBLxHYHRAoGBANfNVYJYeCDPFNLmak5Xg33Rfvc2II8UmrZOVdhOWs8ZK0pis9e+\nPo2MKtTzrzipXI2QXv5w7kO+LJWNDva+xRlW8Wlj9Dde9QdQ7Y8+dk7SJgf24DzM\n023elgX5DvTeLODjStk6SMPRL0FmGovUqAAA8ZeHtJzkIr1HROWnQiwnAoGBANez\nhFwKnVoQu0RpBz/i4W0RKIxOwltN2zmlN8KjJPhSy00A7nBUfKLRbcwiSHE98Yi/\nUrXwMwR5QeD2ngngRppddJnpiRfjNjnsaqeqNtpO8AxB3XjpCC5zmHUMFHKvPpDj\n1zU/F44li0YjKcMBebZy9PbfAjrIgJfxhPo/oXiNAoGAfx6gaTjOAp2ZaaZ7Jozc\nkyft/5et1DrR6+P3I4T8bxQncRj1UXfqhxzzOiAVrm3tbCKIIp/JarRCtRGzp9u2\nZPfXGzra6CcSdW3Rkli7/jBCYNynOIl7XjQI8ZnFmq6phwu80ntH07mMeZy4tHff\nQqlLpvQ0i1rDr/Wkexdsnm8CgYBgxha9ILoF/Xm3MJPjEsxmnYsen/tM8XpIu5pv\nxbhBfQvfKWrQlOcyOVnUexEbVVo3KvdVz0VkXW60GpE/BxNGEGXO49rxD6x1gl87\nh/+CJGZIaYiOxaY5CP2+jcPizEL6yG32Yq8TxD5fIkmLRu8vbxX+aIFclDY1dVNe\n3wt3xQKBgGEL0EjwRch+P2V+YHAhbETPrEqJjHRWT95pIdF9XtC8fasSOVH81cLX\nXXsX1FTvOJNwG9Nk8rQjYJXGTb2O/2unaazlYUwxKwVpwuGzz/vhH/roHZBAkIVT\njvpykpn9QMezEdpzj5BEv01QzSYBPzIh5myrpoJIoSW7py7zFG3h\n-----END RSA PRIVATE KEY-----\n',
			token: '!00000000000000000000000000000000',
			password: '$2a$08$FnHXg3tP.M/kINWgQSXNqeoBsiVrkj.ecXX8mW9rfBzMRkibYfjYy', // HimawariDaisuki06160907
			profile: {},
			settings: {},
			clientSettings: {}
		}
	}, opts));
}

function insertHimawari(opts?) {
	return db.get('users').insert(merge({
		username: 'himawari',
		usernameLower: 'himawari',
		account: {
			keypair: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAtdTG9rlFWjNqhgbg2V6X5XF1WpQXZS3KNXykEWl2UAiMyfVV\nBvf3zQP0dDEdNtcqdPJgis03bpiHCzQusc/YLyHYB0m+TJXsxJatb8cqUogOFeE4\ngQ4Dc5kAT6gLh/d4yz03EIg9bizX07EiGWnZqWxb+21ypqsPxST64sAtG9f5O/G4\nXe2m3cSbfAAvEUP1Ig1LUNyJB4jhM60w1cQic/qO8++sk/+GoX9g71X+i4NArGv+\n1c11acDIIPGAAQpFeYVeGaKakNDNp8RtJJp8R8FLwJXZ4/gATBnScCiHUSrGfRly\nYyR0w/BNlQ6/NijAdB9pR5csPvyIPkx1gauZewIDAQABAoIBAQCwWf/mhuY2h6uG\n9eDZsZ7Mj2/sO7k9Dl4R5iMSKCDxmnlB3slqitExa+aJUqEs8R5icjkkJcjfYNuJ\nCEFJf3YCsGZfGyyQBtCuEh2ATcBEb2SJ3/f3YuoCEaB1oVwdsOzc4TAovpol4yQo\nUqHp1/mdElVb01jhQQN4h1c02IJnfzvfU1C8szBni+Etfd+MxqGfv006DY3KOEb3\nlCrCS3GmooJW2Fjj7q1kCcaEQbMB1/aQHLXd1qe3KJOzXh3Voxsp/jEH0hvp2TII\nfY9UK+b7mA+xlvXwKuTkHVaZm0ylg0nbembS8MF4GfFMujinSexvLrVKaQhdMFoF\nvBLxHYHRAoGBANfNVYJYeCDPFNLmak5Xg33Rfvc2II8UmrZOVdhOWs8ZK0pis9e+\nPo2MKtTzrzipXI2QXv5w7kO+LJWNDva+xRlW8Wlj9Dde9QdQ7Y8+dk7SJgf24DzM\n023elgX5DvTeLODjStk6SMPRL0FmGovUqAAA8ZeHtJzkIr1HROWnQiwnAoGBANez\nhFwKnVoQu0RpBz/i4W0RKIxOwltN2zmlN8KjJPhSy00A7nBUfKLRbcwiSHE98Yi/\nUrXwMwR5QeD2ngngRppddJnpiRfjNjnsaqeqNtpO8AxB3XjpCC5zmHUMFHKvPpDj\n1zU/F44li0YjKcMBebZy9PbfAjrIgJfxhPo/oXiNAoGAfx6gaTjOAp2ZaaZ7Jozc\nkyft/5et1DrR6+P3I4T8bxQncRj1UXfqhxzzOiAVrm3tbCKIIp/JarRCtRGzp9u2\nZPfXGzra6CcSdW3Rkli7/jBCYNynOIl7XjQI8ZnFmq6phwu80ntH07mMeZy4tHff\nQqlLpvQ0i1rDr/Wkexdsnm8CgYBgxha9ILoF/Xm3MJPjEsxmnYsen/tM8XpIu5pv\nxbhBfQvfKWrQlOcyOVnUexEbVVo3KvdVz0VkXW60GpE/BxNGEGXO49rxD6x1gl87\nh/+CJGZIaYiOxaY5CP2+jcPizEL6yG32Yq8TxD5fIkmLRu8vbxX+aIFclDY1dVNe\n3wt3xQKBgGEL0EjwRch+P2V+YHAhbETPrEqJjHRWT95pIdF9XtC8fasSOVH81cLX\nXXsX1FTvOJNwG9Nk8rQjYJXGTb2O/2unaazlYUwxKwVpwuGzz/vhH/roHZBAkIVT\njvpykpn9QMezEdpzj5BEv01QzSYBPzIh5myrpoJIoSW7py7zFG3h\n-----END RSA PRIVATE KEY-----\n',
			token: '!00000000000000000000000000000001',
			password: '$2a$08$OPESxR2RE/ZijjGanNKk6ezSqGFitqsbZqTjWUZPLhORMKxHCbc4O', // ilovesakurako
			profile: {},
			settings: {},
			clientSettings: {}
		}
	}, opts));
}

function insertDriveFile(opts?) {
	return db.get('driveFiles.files').insert({
		length: opts.datasize,
		filename: 'strawberry-pasta.png',
		metadata: opts
	});
}

function insertDriveFolder(opts?) {
	return db.get('driveFolders').insert(merge({
		name: 'my folder',
		parentId: null
	}, opts));
}

function insertApp(opts?) {
	return db.get('apps').insert(merge({
		name: 'my app',
		secret: 'mysecret'
	}, opts));
}
