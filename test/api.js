/**
 * API TESTS
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const server = require('../built/api/server');
const db = require('../built/db/mongodb').default;

const request = (endpoint, params, me) => new Promise((ok, ng) => {
	chai.request(server)
		.post(endpoint)
		.set('content-type', 'application/x-www-form-urlencoded')
		.send(Object.assign({ i: (me || { token: null }).token }, params))
		.end((err, res) => {
			ok(res);
		});
});

describe('API', () => {
	// Reset database each test
	beforeEach(() => Promise.all([
		db.get('users').drop(),
		db.get('posts').drop()
	]));

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

	it('i/update', () => new Promise(async (done) => {
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

	describe('posts/create', () => {
		it('simple', () => new Promise(async (done) => {
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

		it('reply', () => new Promise(async (done) => {
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

		it('repost', () => new Promise(async (done) => {
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

		it('引用repost', () => new Promise(async (done) => {
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
	});

	describe('followings/create', () => {
		it('フォローできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			request('/followings/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('id').eql(hima._id.toString());
				done();
			});
		}));

		it('過去にフォロー歴があった状態でフォローできる', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('followings').insert({
				followee_id: hima._id,
				follower_id: me._id,
				deleted_at: new Date()
			});
			request('/followings/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('id').eql(hima._id.toString());
				done();
			});
		}));

		it('既にフォローしている場合は怒る', () => new Promise(async (done) => {
			const hima = await insertHimawari();
			const me = await insertSakurako();
			await db.get('followings').insert({
				followee_id: hima._id,
				follower_id: me._id
			});
			request('/followings/create', {
				user_id: hima._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('存在しないユーザーはフォローできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/followings/create', {
				user_id: 'kyoppie'
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('自分自身はフォローできない', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/followings/create', {
				user_id: me._id.toString()
			}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));

		it('空のパラメータで怒られる', () => new Promise(async (done) => {
			const me = await insertSakurako();
			request('/followings/create', {}, me).then(res => {
				res.should.have.status(400);
				done();
			});
		}));
	});
});

async function insertSakurako() {
	return await db.get('users').insert({
		token: '!00000000000000000000000000000000',
		username: 'sakurako',
		username_lower: 'sakurako',
		password: '$2a$14$wlDw/gDIEE7hHpkJA4yZE.bRUZc.ykHhPfVXPaw2cfOldyParYM76' // HimawariDaisuki06160907
	});
}

async function insertHimawari() {
	return await db.get('users').insert({
		token: '!00000000000000000000000000000001',
		username: 'himawari',
		username_lower: 'himawari',
		password: '$2a$14$8kwC/akV/Gzk58vsTDAate2ixGjQRtC1j3c4IQAqZ7QLvawRMQsPO' // ilovesakurako
	});
}
