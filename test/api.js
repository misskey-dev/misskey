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
		.send(Object.assign({ i: me }, params))
		.end((err, res) => {
			ok(res);
		});
});

describe('API', () => {
	// Reset database
	db.get('users').drop();
	db.get('posts').drop();

	it('greet server', done => {
		chai.request(server)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.text.should.be.equal('YEE HAW');
				done();
			});
	});

	const account = {
		username: 'sakurako',
		password: 'HimawariDaisuki06160907'
	};

	let me;

	describe('signup', () => {
		it('不正なユーザー名でアカウントが作成できない', done => {
			request('/signup', {
				username: 'sakurako.',
				password: account.password
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		});

		it('空のパスワードでアカウントが作成できない', done => {
			request('/signup', {
				username: account.username,
				password: ''
			}).then(res => {
				res.should.have.status(400);
				done();
			});
		});

		it('正しくアカウントが作成できる', done => {
			request('/signup', account).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('username').eql(account.username);
				done();
			});
		});

		it('同じユーザー名のアカウントは作成できない', done => {
			request('/signup', account).then(res => {
				res.should.have.status(400);
				done();
			});
		});
	});

	describe('signin', () => {
		it('間違ったパスワードでサインインできない', done => {
			request('/signin', {
				username: account.username,
				password: account.password + '.'
			}).then(res => {
				res.should.have.status(400);
				res.text.should.be.equal('incorrect password');
				done();
			});
		});

		it('正しい情報でサインインできる', done => {
			request('/signin', account).then(res => {
				res.should.have.status(204);
				me = res.header['set-cookie'][0].match(/i=(!\w+)/)[1];
				done();
			});
		});
	});

	it('i/update', done => {
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
	});

	describe('posts/create', () => {
		it('simple', done => {
			const post = {
				text: 'ひまわりー'
			};
			request('/posts/create', post, me).then(res => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				done();
			});
		});

		it('reply', () => {

		});

		it('repost', () => {

		});
	});
});
