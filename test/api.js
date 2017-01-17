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

	it('create account', done => {
		chai.request(server)
			.post('/signup')
			.set('content-type', 'application/x-www-form-urlencoded')
			.send(account)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('username').eql(account.username);
				done();
			});
	});

	it('signin', done => {
		chai.request(server)
			.post('/signin')
			.set('content-type', 'application/x-www-form-urlencoded')
			.send(account)
			.end((err, res) => {
				res.should.have.status(204);
				me = res.header['set-cookie'][0].match(/i=(!\w+)/)[1];
				done();
			});
	});

	describe('i/update', () => {
		it('update my name', done => {
			const myName = '大室櫻子';
			chai.request(server)
				.post('/i/update')
				.set('content-type', 'application/x-www-form-urlencoded')
				.send(Object.assign({ i: me }, {
					name: myName
				}))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.have.property('name').eql(myName);
					done();
				});
		});
	});

	describe('posts/create', () => {
		it('simple', done => {
			const post = {
				text: 'Hi'
			};
			chai.request(server)
				.post('/posts/create')
				.set('content-type', 'application/x-www-form-urlencoded')
				.send(Object.assign({ i: me }, post))
				.end((err, res) => {
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