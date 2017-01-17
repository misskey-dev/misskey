/**
 * API TESTS
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const server = require('../built/api/server');

describe('API', () => {
	it('greet server', done => {
		chai.request(server)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.text.should.be.equal('YEE HAW');
				done();
			});
	});

	it('create account', done => {
		const account = {
			username: 'sakurako',
			password: 'HimawariDaisuki06160907'
		};
		chai.request(server)
			.post('/signup')
			.send(account)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('username').eql(account.username);
				done();
			});
	});

	describe('posts/create', () => {
		it('simple', done => {
			const post = {
				text: 'Hi'
			};
			chai.request(server)
				.post('/posts/create')
				.send(post)
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