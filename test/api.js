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

describe('API', () => {
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