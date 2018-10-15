/*
 * Tests of API
 */

import * as http from 'http';
import * as assert from 'chai';

assert.use(require('chai-http'));
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
const async = (fn: Function) => (done: Function) => {
	fn().then(() => {
		done();
	}, (err: Error) => {
		done(err);
	});
};

const request = async (endpoint: string, params: any, me?: any): Promise<ChaiHttp.Response> => {
	const auth = me ? {
		i: me.token
	} : {};

	const res = await assert.request(server)
		.post(endpoint)
		.send(Object.assign(auth, params));

	return res;
};

const signup = async (params?: any) => {
	const q = Object.assign({
		username: 'test',
		password: 'test'
	}, params);

	const res = await request('/signup', q);

	return res.body;
};
//#endregion

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

	describe('signup', () => {
		it('不正なユーザー名でアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'test.',
				password: 'test'
			});
			expect(res).to.have.status(400);
		}));

		it('空のパスワードでアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'test',
				password: ''
			});
			expect(res).to.have.status(400);
		}));

		it('正しくアカウントが作成できる', async(async () => {
			const me = {
				username: 'test',
				password: 'test'
			};
			const res = await request('/signup', me);
			expect(res).to.have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('username').eql(me.username);
		}));

		it('同じユーザー名のアカウントは作成できない', async(async () => {
			await signup({
				username: 'test'
			});
			const res = await request('/signup', {
				username: 'test',
				password: 'test'
			});
			expect(res).to.have.status(400);
		}));
	});

	describe('signin', () => {
		it('間違ったパスワードでサインインできない', async(async () => {
			await signup({
				username: 'test',
				password: 'foo'
			});
			const res = await request('/signin', {
				username: 'test',
				password: 'bar'
			});
			expect(res).to.have.status(403);
		}));

		it('クエリをインジェクションできない', async(async () => {
			await signup({
				username: 'test'
			});
			const res = await request('/signin', {
				username: 'test',
				password: {
					$gt: ''
				}
			});
			expect(res).to.have.status(400);
		}));

		it('正しい情報でサインインできる', async(async () => {
			await signup({
				username: 'test',
				password: 'foo'
			});
			const res = await request('/signin', {
				username: 'test',
				password: 'foo'
			});
			expect(res).to.have.status(204);
		}));
	});
});
