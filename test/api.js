/**
 * API TESTS
 */

Error.stackTraceLimit = Infinity;

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);

// Init babel
require('babel-core/register');
require('babel-polyfill');

const fs = require('fs');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const server = require('../built/api/server');
const db = require('../built/db/mongodb').default;

const request = (endpoint, params, me) => new Promise((ok, ng) => {
	const auth = me ? {
		i: me.token
	} : {};

	chai.request(server)
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
		db.get('drive_files').drop(),
		db.get('drive_folders').drop(),
		db.get('apps').drop(),
		db.get('access_tokens').drop(),
		db.get('auth_sessions').drop()
	]));

	afterEach(cb => setTimeout(cb, 100));

	it('greet server', done => {
		chai.request(server)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.text.should.be.equal('YEE HAW');
				done();
			});
	});

	describe('signup', () => {
		it('不正なユーザー名でアカウントが作成できない', done => {
			request('/signup', {
				username: 'sakurako.',
				password: 'HimawariDaisuki06160907'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		});

		it('空のパスワードでアカウントが作成できない', done => {
			request('/signup', {
				username: 'sakurako',
				password: ''
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		});

		it('正しくアカウントが作成できる', done => {
			const me = {
				username: 'sakurako',
				password: 'HimawariDaisuki06160907'
			};
			request('/signup', me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('username').eql(me.username);
				done();
			});
		});

		it('同じユーザー名のアカウントは作成できない', () => new Promise(async (done) => {
			const user = await insertSakurako();
			request('/signup', {
				username: user.username,
				password: 'HimawariDaisuki06160907'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('signin', () => {
		it('間違ったパスワードでサインインできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/signin', {
				username: me.username,
				password: 'kyoppie'
			}).then(res => {
				res.should.have.status(400);
				res.text.should.be.equal('incorrect password');
				done();
			});
		}));

		it('正しい情報でサインインできる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/signin', {
				username: me.username,
				password: 'HimawariDaisuki06160907'
			}).then(res => {
				res.should.have.status(204);
				done();
			});
		}));
	});

	describe('i/update', () => {
		it('アカウント設定を更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();

			const myName = '大室櫻子';
			const myLocation = '七森中';
			const myBirthday = '2000-09-07';

			request('/i/update', {
				name: myName,
				location: myLocation,
				birthday: myBirthday
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('name').eql(myName);
				res.body.should.have.property('location').eql(myLocation);
				res.body.should.have.property('birthday').eql(myBirthday);
				done();
			});
		}));

		it('誕生日の設定を削除できる', () => new Promise(async (done) => {
			const me = await insertSakurako({
				birthday: '2000-09-07'
			});
			request('/i/update', {
				birthday: ''
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('birthday').eql(null);
				done();
			});
		}));

		it('不正な誕生日の形式で怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/i/update', {
				birthday: '2000/09/07'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('users/show', () => {
		it('ユーザーが取得できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/users/show', {
				user_id: me._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('id').eql(me._id.toString());
				done();
			});
		}));

		it('ユーザーが存在しなかったら怒る', () => new Promise(async (done) => {
			request('/users/show', {
				user_id: '000000000000000000000000'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			request('/users/show', {
				user_id: 'kyoppie'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('posts/create', () => {
		it('投稿できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				text: 'ひまわりー'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('text').eql(post.text);
				done();
			});
		}));

		it('ファイルを添付できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			request('/posts/create', {
				media_ids: [file._id.toString()]
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('media_ids').eql([file._id.toString()]);
				done();
			});
		}));

		it('他人のファイルは添付できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				user_id: hima._id
			});
			request('/posts/create', {
				media_ids: [file._id.toString()]
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないファイルは添付できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/create', {
				media_ids: ['000000000000000000000000']
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正なファイルIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/create', {
				media_ids: ['kyoppie']
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('返信できる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			const post = {
				text: 'さく',
				reply_to_id: himaPost._id.toString()
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('text').eql(post.text);
				res.body.should.have.property('reply_to_id').eql(post.reply_to_id);
				res.body.should.have.property('reply_to');
				res.body.reply_to.should.have.property('text').eql(himaPost.text);
				done();
			});
		}));

		it('repostできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'こらっさくらこ！'
			});

			const me = await insertSakurako();
			const post = {
				repost_id: himaPost._id.toString()
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('repost_id').eql(post.repost_id);
				res.body.should.have.property('repost');
				res.body.repost.should.have.property('text').eql(himaPost.text);
				done();
			});
		}));

		it('引用repostできる', () => new Promise(async (done) => {
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
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('text').eql(post.text);
				res.body.should.have.property('repost_id').eql(post.repost_id);
				res.body.should.have.property('repost');
				res.body.repost.should.have.property('text').eql(himaPost.text);
				done();
			});
		}));

		it('文字数ぎりぎりで怒られない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				text: '!'.repeat(1000)
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				done();
			});
		}));

		it('文字数オーバーで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				text: '!'.repeat(1001)
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないリプライ先で怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				text: 'さく',
				reply_to_id: '000000000000000000000000'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないrepost対象で怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				repost_id: '000000000000000000000000'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正なリプライ先IDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				text: 'さく',
				reply_to_id: 'kyoppie'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正なrepost対象IDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const post = {
				repost_id: 'kyoppie'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('posts/show', () => {
		it('投稿が取得できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const myPost = await db.get('posts').insert({
				user_id: me._id,
				text: 'お腹ペコい'
			});
			request('/posts/show', {
				post_id: myPost._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('id').eql(myPost._id.toString());
				done();
			});
		}));

		it('投稿が存在しなかったら怒る', () => new Promise(async (done) => {
			request('/posts/show', {
				post_id: '000000000000000000000000'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			request('/posts/show', {
				post_id: 'kyoppie'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('posts/likes/create', () => {
		it('いいねできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			request('/posts/likes/create', {
				post_id: himaPost._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('自分の投稿にはいいねできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const myPost = await db.get('posts').insert({
				user_id: me._id,
				text: 'お腹ペコい'
			});

			request('/posts/likes/create', {
				post_id: myPost._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('二重にいいねできない', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('likes').insert({
				user_id: me._id,
				post_id: himaPost._id
			});

			request('/posts/likes/create', {
				post_id: himaPost._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しない投稿にはいいねできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/create', {
				post_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('空のパラメータで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/create', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/create', {
				post_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('posts/likes/delete', () => {
		it('いいね解除できる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			await db.get('likes').insert({
				user_id: me._id,
				post_id: himaPost._id
			});

			request('/posts/likes/delete', {
				post_id: himaPost._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('いいねしていない投稿はいいね解除できない', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const himaPost = await db.get('posts').insert({
				user_id: hima._id,
				text: 'ひま'
			});

			const me = await insertSakurako();
			request('/posts/likes/delete', {
				post_id: himaPost._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しない投稿はいいね解除できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/delete', {
				post_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('空のパラメータで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/delete', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/posts/likes/delete', {
				post_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('following/create', () => {
		it('フォローできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			request('/following/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('過去にフォロー歴があった状態でフォローできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id,
				deleted_at: new Date()
			});
			request('/following/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('既にフォローしている場合は怒る', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			request('/following/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないユーザーはフォローできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/create', {
				user_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('自分自身はフォローできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/create', {
				user_id: me._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('空のパラメータで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/create', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/create', {
				user_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('following/delete', () => {
		it('フォロー解除できる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('following').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			request('/following/delete', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('過去にフォロー歴があった状態でフォロー解除できる', () => new Promise(async (done) => {
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
			request('/following/delete', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(204);
				done();
			});
		}));

		it('フォローしていない場合は怒る', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			request('/following/delete', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないユーザーはフォロー解除できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/delete', {
				user_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('自分自身はフォロー解除できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/delete', {
				user_id: me._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('空のパラメータで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/delete', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/following/delete', {
				user_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('drive', () => {
		it('ドライブ情報を取得できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id,
				datasize: 1024
			});
			request('/drive', {}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('usage').eql(1024);
				done();
			});
		}));
	});

	describe('drive/files/create', () => {
		it('ファイルを作成できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			chai.request(server)
				.post('/drive/files/create')
				.field('i', me.token)
				.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png')
				.end((err, res) => {
					if (err) console.error(err);
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.have.property('name').eql('Lenna.png');
					done();
				});
		}));

		it('ファイル無しで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/files/create', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('drive/files/update', () => {
		it('名前を更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const newName = 'いちごパスタ.png';
			request('/drive/files/update', {
				file_id: file._id.toString(),
				name: newName
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('name').eql(newName);
				done();
			});
		}));

		it('他人のファイルは更新できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				user_id: hima._id
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				name: 'いちごパスタ.png'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('親フォルダを更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: folder._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('folder_id').eql(folder._id.toString());
				done();
			});
		}));

		it('親フォルダを無しにできる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id,
				folder_id: '000000000000000000000000'
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: null
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('folder_id').eql(null);
				done();
			});
		}));

		it('他人のフォルダには入れられない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const file = await insertDriveFile({
				user_id: me._id
			});
			const folder = await insertDriveFolder({
				user_id: hima._id
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: folder._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないフォルダで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正なフォルダIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const file = await insertDriveFile({
				user_id: me._id
			});
			request('/drive/files/update', {
				file_id: file._id.toString(),
				folder_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('ファイルが存在しなかったら怒る', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/files/update', {
				file_id: '000000000000000000000000',
				name: 'いちごパスタ.png'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('間違ったIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/files/update', {
				file_id: 'kyoppie',
				name: 'いちごパスタ.png'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('drive/folders/create', () => {
		it('フォルダを作成できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/folders/create', {
				name: 'my folder'
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('name').eql('my folder');
				done();
			});
		}));
	});

	describe('drive/folders/update', () => {
		it('名前を更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				name: 'new name'
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('name').eql('new name');
				done();
			});
		}));

		it('他人のフォルダを更新できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const folder = await insertDriveFolder({
				user_id: hima._id
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				name: 'new name'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('親フォルダを更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			const parentFolder = await insertDriveFolder({
				user_id: me._id
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('parent_id').eql(parentFolder._id.toString());
				done();
			});
		}));

		it('親フォルダを無しに更新できる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder({
				user_id: me._id,
				parent_id: '000000000000000000000000'
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: null
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('parent_id').eql(null);
				done();
			});
		}));

		it('他人のフォルダを親フォルダに設定できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const hima = await insertHimawari();
			const folder = await insertDriveFolder({
				user_id: me._id
			});
			const parentFolder = await insertDriveFolder({
				user_id: hima._id
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('フォルダが循環するような構造にできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			const parentFolder = await insertDriveFolder({
				parent_id: folder._id
			});
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: parentFolder._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('フォルダが循環するような構造にできない(再帰的)', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folderA = await insertDriveFolder();
			const folderB = await insertDriveFolder({
				parent_id: folderA._id
			});
			const folderC = await insertDriveFolder({
				parent_id: folderB._id
			});
			request('/drive/folders/update', {
				folder_id: folderA._id.toString(),
				parent_id: folderC._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しない親フォルダを設定できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正な親フォルダIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			const folder = await insertDriveFolder();
			request('/drive/folders/update', {
				folder_id: folder._id.toString(),
				parent_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないフォルダを更新できない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/folders/update', {
				folder_id: '000000000000000000000000'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('不正なフォルダIDで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/drive/folders/update', {
				folder_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});

	describe('auth/session/generate', () => {
		it('認証セッションを作成できる', () => new Promise(async (done) => {
			const app = await insertApp();
			request('/auth/session/generate', {
				app_secret: app.secret
			}).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('token');
				res.body.should.have.property('url');
				done();
			});
		}));

		it('app_secret 無しで怒られる', () => new Promise(async (done) => {
			request('/auth/session/generate', {}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('誤った app secret で怒られる', () => new Promise(async (done) => {
			request('/auth/session/generate', {
				app_secret: 'kyoppie'
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});
});

async function insertSakurako(opts) {
	return await db.get('users').insert(Object.assign({
		token: '!00000000000000000000000000000000',
		username: 'sakurako',
		username_lower: 'sakurako',
		password: '$2a$08$FnHXg3tP.M/kINWgQSXNqeoBsiVrkj.ecXX8mW9rfBzMRkibYfjYy' // HimawariDaisuki06160907
	}, opts));
}

async function insertHimawari(opts) {
	return await db.get('users').insert(Object.assign({
		token: '!00000000000000000000000000000001',
		username: 'himawari',
		username_lower: 'himawari',
		password: '$2a$08$OPESxR2RE/ZijjGanNKk6ezSqGFitqsbZqTjWUZPLhORMKxHCbc4O' // ilovesakurako
	}, opts));
}

async function insertDriveFile(opts) {
	return await db.get('drive_files').insert(Object.assign({
		name: 'strawberry-pasta.png'
	}, opts));
}

async function insertDriveFolder(opts) {
	return await db.get('drive_folders').insert(Object.assign({
		name: 'my folder',
		parent_id: null
	}, opts));
}

async function insertApp(opts) {
	return await db.get('apps').insert(Object.assign({
		name: 'my app',
		secret: 'mysecret'
	}, opts));
}

