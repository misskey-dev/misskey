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
			expect(res).have.status(400);
		}));

		it('空のパスワードでアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'test',
				password: ''
			});
			expect(res).have.status(400);
		}));

		it('正しくアカウントが作成できる', async(async () => {
			const me = {
				username: 'test',
				password: 'test'
			};
			const res = await request('/signup', me);
			expect(res).have.status(200);
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
			expect(res).have.status(400);
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
			expect(res).have.status(403);
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
			expect(res).have.status(400);
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
			expect(res).have.status(204);
		}));
	});

	describe('i/update', () => {
		it('アカウント設定を更新できる', async(async () => {
			const me = await signup();

			const myName = '大室櫻子';
			const myLocation = '七森中';
			const myBirthday = '2000-09-07';

			const res = await request('/i/update', {
				name: myName,
				location: myLocation,
				birthday: myBirthday
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql(myName);
			expect(res.body).have.nested.property('profile').a('object');
			expect(res.body).have.nested.property('profile.location').eql(myLocation);
			expect(res.body).have.nested.property('profile.birthday').eql(myBirthday);
		}));

		it('名前を空白にできない', async(async () => {
			const me = await signup();
			const res = await request('/i/update', {
				name: ' '
			}, me);
			expect(res).have.status(400);
		}));

		it('誕生日の設定を削除できる', async(async () => {
			const me = await signup();
			await request('/i/update', {
				birthday: '2000-09-07'
			}, me);
			const res = await request('/i/update', {
				birthday: null
			}, me);
			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.nested.property('profile').a('object');
			expect(res.body).have.nested.property('profile.birthday').eql(null);
		}));

		it('不正な誕生日の形式で怒られる', async(async () => {
			const me = await signup();
			const res = await request('/i/update', {
				birthday: '2000/09/07'
			}, me);
			expect(res).have.status(400);
		}));
	});

	describe('users/show', () => {
		it('ユーザーが取得できる', async(async () => {
			const me = await signup();
			const res = await request('/users/show', {
				userId: me.id
			}, me);
			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('id').eql(me.id);
		}));

		it('ユーザーが存在しなかったら怒る', async(async () => {
			const res = await request('/users/show', {
				userId: '000000000000000000000000'
			});
			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/users/show', {
				userId: 'kyoppie'
			});
			expect(res).have.status(400);
		}));
	});
});
