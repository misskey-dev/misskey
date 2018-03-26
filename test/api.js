/**
 * API TESTS
 */

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

const server = require('../built/api/server');
const db = require('../built/db/mongodb').default;

const async = fn => (done) => {
	fn().then(() => {
		done();
	}, err => {
		done(err);
	});
};

const request = (endpoint, params, me) => new Promise((ok, ng) => {
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
		db.get('drive_files.files').drop(),
		db.get('drive_files.chunks').drop(),
		db.get('drive_folders').drop(),
		db.get('apps').drop(),
		db.get('access_tokens').drop(),
		db.get('auth_sessions').drop()
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
				user_id: me._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('id').eql(me._id.toString());
		}));

		it('ユーザーが存在しなかったら怒る', async(async () => {
			const res = await request('/users/show', {
				user_id: '000000000000000000000000'
			});
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/users/show', {
				user_id: 'kyoppie'
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
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('text').eql(post.text);
		}));

		it('ファイルを添付できる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const res = await request('/posts/create', {
				media_ids: [file._id.toString()]
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('media_ids').eql([file._id.toString()]);
		}));

		it('他人のファイルは添付できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				user_id: hima._id
			});
			const res = await request('/posts/create', {
				media_ids: [file._id.toString()]
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないファイルは添付できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				media_ids: ['000000000000000000000000']
			}, me);
			res.should.have.status(400);
		}));

		it('不正なファイルIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/create', {
				media_ids: ['kyoppie']
			}, me);
			res.should.have.status(400);
		}));

		it('返信できる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const post = {
				text: 'さく',
				reply_id: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('text').eql(post.text);
			res.body.created_post.should.have.property('reply_id').eql(post.reply_id);
			res.body.created_post.should.have.property('reply');
			res.body.created_post.reply.should.have.property('text').eql(himaPost.text);
		}));

		it('repostできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'こらっさくらこ！'
			});

			const me = await insertSakurako();
			const post = {
				repost_id: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('repost_id').eql(post.repost_id);
			res.body.created_post.should.have.property('repost');
			res.body.created_post.repost.should.have.property('text').eql(himaPost.text);
		}));

		it('引用repostできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'こらっさくらこ！'
			});

			const me = await insertSakurako();
			const post = {
				text: 'さく',
				repost_id: himaPost._id.toString()
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('text').eql(post.text);
			res.body.created_post.should.have.property('repost_id').eql(post.repost_id);
			res.body.created_post.should.have.property('repost');
			res.body.created_post.repost.should.have.property('text').eql(himaPost.text);
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
				reply_id: '000000000000000000000000'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('存在しないrepost対象で怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				repost_id: '000000000000000000000000'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('不正なリプライ先IDで怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				text: 'さく',
				reply_id: 'kyoppie'
			};
			const res = await request('/posts/create', post, me);
			res.should.have.status(400);
		}));

		it('不正なrepost対象IDで怒られる', async(async () => {
			const me = await insertSakurako();
			const post = {
				repost_id: 'kyoppie'
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
			res.body.should.have.property('created_post');
			res.body.created_post.should.have.property('poll');
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
				user_id: me._id,
				text: 'お腹ペコい'
			});
			const res = await request('/posts/show', {
				post_id: myPost._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('id').eql(myPost._id.toString());
		}));

		it('投稿が存在しなかったら怒る', async(async () => {
			const res = await request('/posts/show', {
				post_id: '000000000000000000000000'
			});
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/posts/show', {
				post_id: 'kyoppie'
			});
			res.should.have.status(400);
		}));
	});

	describe('posts/reactions/create', () => {
		it('リアクションできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {
				post_id: himaPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(204);
		}));

		it('自分の投稿にはリアクションできない', async(async () => {
			const me = await insertSakurako();
			const myPost = await db.get('posts').insert({
				user_id: me._id,
				text: 'お腹ペコい'
			});

			const res = await request('/posts/reactions/create', {
				post_id: myPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));

		it('二重にリアクションできない', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('post_reactions').insert({
				user_id: me._id,
				post_id: himaPost._id,
				reaction: 'like'
			});

			const res = await request('/posts/reactions/create', {
				post_id: himaPost._id.toString(),
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない投稿にはリアクションできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/create', {
				post_id: '000000000000000000000000',
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
				post_id: 'kyoppie',
				reaction: 'like'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('posts/reactions/delete', () => {
		it('リアクションをキャンセルできる', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('post_reactions').insert({
				user_id: me._id,
				post_id: himaPost._id,
				reaction: 'like'
			});

			const res = await request('/posts/reactions/delete', {
				post_id: himaPost._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('リアクションしていない投稿はリアクションをキャンセルできない', async(async () => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {
				post_id: himaPost._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない投稿はリアクションをキャンセルできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/posts/reactions/delete', {
				post_id: '000000000000000000000000'
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
				post_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('following/create', () => {
		it('フォローできる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			const res = await request('/following/create', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('過去にフォロー歴があった状態でフォローできる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id,
				deleted_at: new Date()
			});
			const res = await request('/following/create', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('既にフォローしている場合は怒る', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			const res = await request('/following/create', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーはフォローできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {
				user_id: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('自分自身はフォローできない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/create', {
				user_id: me._id.toString()
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
				user_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('following/delete', () => {
		it('フォロー解除できる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			const res = await request('/following/delete', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('過去にフォロー歴があった状態でフォロー解除できる', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id,
				deleted_at: new Date()
			});
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			const res = await request('/following/delete', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(204);
		}));

		it('フォローしていない場合は怒る', async(async () => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーはフォロー解除できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				user_id: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('自分自身はフォロー解除できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/following/delete', {
				user_id: me._id.toString()
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
				user_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('drive', () => {
		it('ドライブ情報を取得できる', async(async () => {
			const me = await insertSakurako();
			await insertDriveFile({
				user_id: me._id,
				datasize: 256
			});
			await insertDriveFile({
				user_id: me._id,
				datasize: 512
			});
			await insertDriveFile({
				user_id: me._id,
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
				user_id: me._id
			});
			const newName = 'いちごパスタ.png';
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
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
				user_id: hima._id
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				name: 'いちごパスタ.png'
			}, me);
			res.should.have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: folder._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('folder_id').eql(folder._id.toString());
		}));

		it('親フォルダを無しにできる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id,
				folder_id: '000000000000000000000000'
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: null
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('folder_id').eql(null);
		}));

		it('他人のフォルダには入れられない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const folder = await insertDriveFolder({
				user_id: hima._id
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: folder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないフォルダで怒られる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const res = await request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));

		it('ファイルが存在しなかったら怒る', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/files/update', {
				file_id: '000000000000000000000000',
				name: 'いちごパスタ.png'
			}, me);
			res.should.have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/files/update', {
				file_id: 'kyoppie',
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
				user_id: me._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
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
				user_id: hima._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				name: 'new name'
			}, me);
			res.should.have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			const parentFolder = await insertDriveFolder({
				user_id: me._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('parent_id').eql(parentFolder._id.toString());
		}));

		it('親フォルダを無しに更新できる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				user_id: me._id,
				parent_id: '000000000000000000000000'
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: null
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('parent_id').eql(null);
		}));

		it('他人のフォルダを親フォルダに設定できない', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			const parentFolder = await insertDriveFolder({
				user_id: hima._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('フォルダが循環するような構造にできない', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const parentFolder = await insertDriveFolder({
				parent_id: folder._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('フォルダが循環するような構造にできない(再帰的)', async(async () => {
			const me = await insertSakurako();
			const folderA = await insertDriveFolder();
			const folderB = await insertDriveFolder({
				parent_id: folderA._id
			});
			const folderC = await insertDriveFolder({
				parent_id: folderB._id
			});
			const res = await request('/drive/folders/update', {
				folder_id: folderA._id.toString(),
				parent_id: folderC._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('存在しない親フォルダを設定できない', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正な親フォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const res = await request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないフォルダを更新できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/folders/update', {
				folder_id: '000000000000000000000000'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/drive/folders/update', {
				folder_id: 'kyoppie'
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('messaging/messages/create', () => {
		it('メッセージを送信できる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				user_id: hima._id.toString(),
				text: 'Hey hey ひまわり'
			}, me);
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('text').eql('Hey hey ひまわり');
		}));

		it('自分自身にはメッセージを送信できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				user_id: me._id.toString(),
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('存在しないユーザーにはメッセージを送信できない', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				user_id: '000000000000000000000000',
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('不正なユーザーIDで怒られる', async(async () => {
			const me = await insertSakurako();
			const res = await request('/messaging/messages/create', {
				user_id: 'kyoppie',
				text: 'Yo'
			}, me);
			res.should.have.status(400);
		}));

		it('テキストが無くて怒られる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				user_id: hima._id.toString()
			}, me);
			res.should.have.status(400);
		}));

		it('文字数オーバーで怒られる', async(async () => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const res = await request('/messaging/messages/create', {
				user_id: hima._id.toString(),
				text: '!'.repeat(1001)
			}, me);
			res.should.have.status(400);
		}));
	});

	describe('auth/session/generate', () => {
		it('認証セッションを作成できる', async(async () => {
			const app = await insertApp();
			const res = await request('/auth/session/generate', {
				app_secret: app.secret
			});
			res.should.have.status(200);
			res.body.should.be.a('object');
			res.body.should.have.property('token');
			res.body.should.have.property('url');
		}));

		it('app_secret 無しで怒られる', async(async () => {
			const res = await request('/auth/session/generate', {});
			res.should.have.status(400);
		}));

		it('誤った app secret で怒られる', async(async () => {
			const res = await request('/auth/session/generate', {
				app_secret: 'kyoppie'
			});
			res.should.have.status(400);
		}));
	});
});

function deepAssign(destination, ...sources) {
	for (const source of sources) {
		for (const key in source) {
			const destinationChild = destination[key];

			if (typeof destinationChild === 'object' && destinationChild != null) {
				deepAssign(destinationChild, source[key]);
			} else {
				destination[key] = source[key];
			}
		}
	}

	return destination;
}

function insertSakurako(opts) {
	return db.get('users').insert(deepAssign({
		username: 'sakurako',
		username_lower: 'sakurako',
		account: {
			token: '!00000000000000000000000000000000',
			password: '$2a$08$FnHXg3tP.M/kINWgQSXNqeoBsiVrkj.ecXX8mW9rfBzMRkibYfjYy', // HimawariDaisuki06160907
			profile: {},
			settings: {},
			client_settings: {}
		}
	}, opts));
}

function insertHimawari(opts) {
	return db.get('users').insert(deepAssign({
		username: 'himawari',
		username_lower: 'himawari',
		account: {
			token: '!00000000000000000000000000000001',
			password: '$2a$08$OPESxR2RE/ZijjGanNKk6ezSqGFitqsbZqTjWUZPLhORMKxHCbc4O', // ilovesakurako
			profile: {},
			settings: {},
			client_settings: {}
		}
	}, opts));
}

function insertDriveFile(opts) {
	return db.get('drive_files.files').insert({
		length: opts.datasize,
		filename: 'strawberry-pasta.png',
		metadata: opts
	});
}

function insertDriveFolder(opts) {
	return db.get('drive_folders').insert(deepAssign({
		name: 'my folder',
		parent_id: null
	}, opts));
}

function insertApp(opts) {
	return db.get('apps').insert(deepAssign({
		name: 'my app',
		secret: 'mysecret'
	}, opts));
}
