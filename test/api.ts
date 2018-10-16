/*
 * Tests of API
 */

import * as http from 'http';
import * as fs from 'fs';
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

const signup = async (params?: any): Promise<any> => {
	const q = Object.assign({
		username: 'test',
		password: 'test'
	}, params);

	const res = await request('/signup', q);

	return res.body;
};

const post = async (user: any, params?: any): Promise<any> => {
	const q = Object.assign({
		text: 'test'
	}, params);

	const res = await request('/notes/create', q, user);

	return res.body.createdNote;
};

const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await request('/notes/reactions/create', {
		noteId: note.id,
		reaction: reaction
	}, user);
};

const uploadFile = async (user: any): Promise<any> => {
	const res = await assert.request(server)
		.post('/drive/files/create')
		.field('i', user.token)
		.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');

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

	describe('notes/create', () => {
		it('投稿できる', async(async () => {
			const me = await signup();
			const post = {
				text: 'test'
			};

			const res = await request('/notes/create', post, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('text').eql(post.text);
		}));

		it('ファイルを添付できる', async(async () => {
			const me = await signup();
			const file = await uploadFile(me);

			const res = await request('/notes/create', {
				fileIds: [file.id]
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('fileIds').eql([file.id]);
		}));

		it('他人のファイルは無視', async(async () => {
			const me = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });
			const file = await uploadFile(bob);

			const res = await request('/notes/create', {
				fileIds: [file.id]
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('fileIds').eql([]);
		}));

		it('存在しないファイルは無視', async(async () => {
			const me = await signup();

			const res = await request('/notes/create', {
				fileIds: ['000000000000000000000000']
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('fileIds').eql([]);
		}));

		it('不正なファイルIDで怒られる', async(async () => {
			const me = await signup();
			const res = await request('/notes/create', {
				fileIds: ['kyoppie']
			}, me);
			expect(res).have.status(400);
		}));

		it('返信できる', async(async () => {
			const bob = await signup({ username: 'bob' });
			const bobPost = await post(bob);

			const alice = await signup({ username: 'alice' });
			const alicePost = {
				text: 'test',
				replyId: bobPost.id
			};

			const res = await request('/notes/create', alicePost, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('text').eql(alicePost.text);
			expect(res.body.createdNote).have.property('replyId').eql(alicePost.replyId);
			expect(res.body.createdNote).have.property('reply');
			expect(res.body.createdNote.reply).have.property('text').eql(alicePost.text);
		}));

		it('renoteできる', async(async () => {
			const bob = await signup({ username: 'bob' });
			const bobPost = await post(bob, {
				text: 'test'
			});

			const alice = await signup({ username: 'alice' });
			const alicePost = {
				renoteId: bobPost.id
			};

			const res = await request('/notes/create', alicePost, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('renoteId').eql(alicePost.renoteId);
			expect(res.body.createdNote).have.property('renote');
			expect(res.body.createdNote.renote).have.property('text').eql(bobPost.text);
		}));

		it('引用renoteできる', async(async () => {
			const bob = await signup({ username: 'bob' });
			const bobPost = await post(bob, {
				text: 'test'
			});

			const alice = await signup({ username: 'alice' });
			const alicePost = {
				text: 'test',
				renoteId: bobPost.id
			};

			const res = await request('/notes/create', alicePost, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('text').eql(alicePost.text);
			expect(res.body.createdNote).have.property('renoteId').eql(alicePost.renoteId);
			expect(res.body.createdNote).have.property('renote');
			expect(res.body.createdNote.renote).have.property('text').eql(bobPost.text);
		}));

		it('文字数ぎりぎりで怒られない', async(async () => {
			const me = await signup();
			const post = {
				text: '!'.repeat(1000)
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(200);
		}));

		it('文字数オーバーで怒られる', async(async () => {
			const me = await signup();
			const post = {
				text: '!'.repeat(1001)
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(400);
		}));

		it('存在しないリプライ先で怒られる', async(async () => {
			const me = await signup();
			const post = {
				text: 'test',
				replyId: '000000000000000000000000'
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(400);
		}));

		it('存在しないrenote対象で怒られる', async(async () => {
			const me = await signup();
			const post = {
				renoteId: '000000000000000000000000'
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(400);
		}));

		it('不正なリプライ先IDで怒られる', async(async () => {
			const me = await signup();
			const post = {
				text: 'test',
				replyId: 'foo'
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(400);
		}));

		it('不正なrenote対象IDで怒られる', async(async () => {
			const me = await signup();
			const post = {
				renoteId: 'foo'
			};
			const res = await request('/notes/create', post, me);
			expect(res).have.status(400);
		}));

		it('投票を添付できる', async(async () => {
			const me = await signup();

			const res = await request('/notes/create', {
				text: 'test',
				poll: {
					choices: ['foo', 'bar']
				}
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('createdNote');
			expect(res.body.createdNote).have.property('poll');
		}));

		it('投票の選択肢が無くて怒られる', async(async () => {
			const me = await signup();
			const res = await request('/notes/create', {
				poll: {}
			}, me);
			expect(res).have.status(400);
		}));

		it('投票の選択肢が無くて怒られる (空の配列)', async(async () => {
			const me = await signup();
			const res = await request('/notes/create', {
				poll: {
					choices: []
				}
			}, me);
			expect(res).have.status(400);
		}));

		it('投票の選択肢が1つで怒られる', async(async () => {
			const me = await signup();
			const res = await request('/notes/create', {
				poll: {
					choices: ['Strawberry Pasta']
				}
			}, me);
			expect(res).have.status(400);
		}));
	});

	describe('notes/show', () => {
		it('投稿が取得できる', async(async () => {
			const me = await signup();
			const myPost = await post(me, {
				text: 'test'
			});

			const res = await request('/notes/show', {
				noteId: myPost.id
			}, me);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('id').eql(myPost.id);
			expect(res.body).have.property('text').eql(myPost.text);
		}));

		it('投稿が存在しなかったら怒る', async(async () => {
			const res = await request('/notes/show', {
				noteId: '000000000000000000000000'
			});
			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/notes/show', {
				noteId: 'kyoppie'
			});
			expect(res).have.status(400);
		}));
	});

	describe('notes/reactions/create', () => {
		it('リアクションできる', async(async () => {
			const bob = await signup({ username: 'bob' });
			const bobPost = await post(bob);

			const alice = await signup({ username: 'alice' });
			const res = await request('/notes/reactions/create', {
				noteId: bobPost.id,
				reaction: 'like'
			}, alice);

			expect(res).have.status(204);
		}));

		it('自分の投稿にはリアクションできない', async(async () => {
			const me = await signup();
			const myPost = await post(me);

			const res = await request('/notes/reactions/create', {
				noteId: myPost.id,
				reaction: 'like'
			}, me);

			expect(res).have.status(400);
		}));

		it('二重にリアクションできない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const bobPost = await post(bob);

			const alice = await signup({ username: 'alice' });
			await react(alice, bobPost, 'like');

			const res = await request('/notes/reactions/create', {
				noteId: bobPost.id,
				reaction: 'like'
			}, alice);

			expect(res).have.status(400);
		}));

		it('存在しない投稿にはリアクションできない', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {
				noteId: '000000000000000000000000',
				reaction: 'like'
			}, me);

			expect(res).have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {}, me);

			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {
				noteId: 'kyoppie',
				reaction: 'like'
			}, me);

			expect(res).have.status(400);
		}));
	});

	describe('following/create', () => {
		it('フォローできる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/following/create', {
				userId: alice.id
			}, bob);

			expect(res).have.status(200);
		}));

		it('既にフォローしている場合は怒る', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });
			await request('/following/create', {
				userId: alice.id
			}, bob);

			const res = await request('/following/create', {
				userId: alice.id
			}, bob);

			expect(res).have.status(400);
		}));

		it('存在しないユーザーはフォローできない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: '000000000000000000000000'
			}, alice);

			expect(res).have.status(400);
		}));

		it('自分自身はフォローできない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: alice.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {}, alice);

			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: 'foo'
			}, alice);

			expect(res).have.status(400);
		}));
	});

	describe('following/delete', () => {
		it('フォロー解除できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });
			await request('/following/create', {
				userId: alice.id
			}, bob);

			const res = await request('/following/delete', {
				userId: alice.id
			}, bob);

			expect(res).have.status(200);
		}));

		it('フォローしていない場合は怒る', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/following/delete', {
				userId: alice.id
			}, bob);

			expect(res).have.status(400);
		}));

		it('存在しないユーザーはフォロー解除できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: '000000000000000000000000'
			}, alice);

			expect(res).have.status(400);
		}));

		it('自分自身はフォロー解除できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: alice.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {}, alice);

			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: 'kyoppie'
			}, alice);

			expect(res).have.status(400);
		}));
	});

	describe('drive', () => {
		/*
		it('ドライブ情報を取得できる', async(async () => {
			const bob = await signup({ username: 'bob' });
			await uploadFile({
				userId: me._id,
				datasize: 256
			});
			await uploadFile({
				userId: me._id,
				datasize: 512
			});
			await uploadFile({
				userId: me._id,
				datasize: 1024
			});
			const res = await request('/drive', {}, me);
			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('usage').eql(1792);
		}));*/
	});

	describe('drive/files/create', () => {
		it('ファイルを作成できる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await assert.request(server)
				.post('/drive/files/create')
				.field('i', alice.token)
				.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql('Lenna.png');
		}));

		it('ファイル無しで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/create', {}, alice);

			expect(res).have.status(400);
		}));
	});

	describe('drive/files/update', () => {
		it('名前を更新できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);
			const newName = 'いちごパスタ.png';

			const res = await request('/drive/files/update', {
				fileId: file.id,
				name: newName
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql(newName);
		}));

		it('他人のファイルは更新できない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(bob);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				name: 'いちごパスタ.png'
			}, alice);

			expect(res).have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('folderId').eql(folder.id);
		}));

		it('親フォルダを無しにできる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);

			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;

			await request('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id
			}, alice);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: null
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('folderId').eql(null);
		}));

		it('他人のフォルダには入れられない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, bob)).body;

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: folder.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('存在しないフォルダで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: '000000000000000000000000'
			}, alice);

			expect(res).have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: 'foo'
			}, alice);

			expect(res).have.status(400);
		}));

		it('ファイルが存在しなかったら怒る', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/update', {
				fileId: '000000000000000000000000',
				name: 'いちごパスタ.png'
			}, alice);

			expect(res).have.status(400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/update', {
				fileId: 'kyoppie',
				name: 'いちごパスタ.png'
			}, alice);

			expect(res).have.status(400);
		}));
	});

	describe('drive/folders/create', () => {
		it('フォルダを作成できる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/create', {
				name: 'test'
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql('test');
		}));
	});

	describe('drive/folders/update', () => {
		it('名前を更新できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				name: 'new name'
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql('new name');
		}));

		it('他人のフォルダを更新できない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, bob)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				name: 'new name'
			}, alice);

			expect(res).have.status(400);
		}));

		it('親フォルダを更新できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const parentFolder = (await request('/drive/folders/create', {
				name: 'parent'
			}, alice)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('parentId').eql(parentFolder.id);
		}));

		it('親フォルダを無しに更新できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const parentFolder = (await request('/drive/folders/create', {
				name: 'parent'
			}, alice)).body;
			await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id
			}, alice);

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: null
			}, alice);

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('parentId').eql(null);
		}));

		it('他人のフォルダを親フォルダに設定できない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const parentFolder = (await request('/drive/folders/create', {
				name: 'parent'
			}, bob)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('フォルダが循環するような構造にできない', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const parentFolder = (await request('/drive/folders/create', {
				name: 'parent'
			}, alice)).body;
			await request('/drive/folders/update', {
				folderId: parentFolder.id,
				parentId: folder.id
			}, alice);

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: parentFolder.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('フォルダが循環するような構造にできない(再帰的)', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folderA = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const folderB = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			const folderC = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;
			await request('/drive/folders/update', {
				folderId: folderB.id,
				parentId: folderA.id
			}, alice);
			await request('/drive/folders/update', {
				folderId: folderC.id,
				parentId: folderB.id
			}, alice);

			const res = await request('/drive/folders/update', {
				folderId: folderA.id,
				parentId: folderC.id
			}, alice);

			expect(res).have.status(400);
		}));

		it('存在しない親フォルダを設定できない', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: '000000000000000000000000'
			}, alice);

			expect(res).have.status(400);
		}));

		it('不正な親フォルダIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const folder = (await request('/drive/folders/create', {
				name: 'test'
			}, alice)).body;

			const res = await request('/drive/folders/update', {
				folderId: folder.id,
				parentId: 'foo'
			}, alice);

			expect(res).have.status(400);
		}));

		it('存在しないフォルダを更新できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/update', {
				folderId: '000000000000000000000000'
			}, alice);

			expect(res).have.status(400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/update', {
				folderId: 'foo'
			}, alice);

			expect(res).have.status(400);
		}));
	});
});
