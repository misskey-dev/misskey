/*
 * Tests of API
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/api.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true npx mocha test/api.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */
/*
process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, react, uploadFile } from './utils';

describe('API', () => {
	let p: childProcess.ChildProcess;

	beforeEach(done => {
		p = childProcess.spawn('node', [__dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test' }
		});
		p.on('message', message => {
			if (message === 'ok') {
				done();
			}
		});
	});

	afterEach(() => {
		p.kill();
	});

	describe('signup', () => {
		it('不正なユーザー名でアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'test.',
				password: 'test'
			});
			assert.strictEqual(res.status, 400);
		}));

		it('空のパスワードでアカウントが作成できない', async(async () => {
			const res = await request('/signup', {
				username: 'test',
				password: ''
			});
			assert.strictEqual(res.status, 400);
		}));

		it('正しくアカウントが作成できる', async(async () => {
			const me = {
				username: 'test',
				password: 'test'
			};

			const res = await request('/signup', me);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.username, me.username);
		}));

		it('同じユーザー名のアカウントは作成できない', async(async () => {
			await signup({
				username: 'test'
			});

			const res = await request('/signup', {
				username: 'test',
				password: 'test'
			});

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 403);
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

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 200);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, myName);
			assert.strictEqual(res.body.location, myLocation);
			assert.strictEqual(res.body.birthday, myBirthday);
		}));

		it('名前を空白にできない', async(async () => {
			const me = await signup();
			const res = await request('/i/update', {
				name: ' '
			}, me);
			assert.strictEqual(res.status, 400);
		}));

		it('誕生日の設定を削除できる', async(async () => {
			const me = await signup();
			await request('/i/update', {
				birthday: '2000-09-07'
			}, me);

			const res = await request('/i/update', {
				birthday: null
			}, me);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.birthday, null);
		}));

		it('不正な誕生日の形式で怒られる', async(async () => {
			const me = await signup();
			const res = await request('/i/update', {
				birthday: '2000/09/07'
			}, me);
			assert.strictEqual(res.status, 400);
		}));
	});

	describe('users/show', () => {
		it('ユーザーが取得できる', async(async () => {
			const me = await signup();

			const res = await request('/users/show', {
				userId: me.id
			}, me);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.id, me.id);
		}));

		it('ユーザーが存在しなかったら怒る', async(async () => {
			const res = await request('/users/show', {
				userId: '000000000000000000000000'
			});
			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/users/show', {
				userId: 'kyoppie'
			});
			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.id, myPost.id);
			assert.strictEqual(res.body.text, myPost.text);
		}));

		it('投稿が存在しなかったら怒る', async(async () => {
			const res = await request('/notes/show', {
				noteId: '000000000000000000000000'
			});
			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const res = await request('/notes/show', {
				noteId: 'kyoppie'
			});
			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 204);
		}));

		it('自分の投稿にはリアクションできない', async(async () => {
			const me = await signup();
			const myPost = await post(me);

			const res = await request('/notes/reactions/create', {
				noteId: myPost.id,
				reaction: 'like'
			}, me);

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 400);
		}));

		it('存在しない投稿にはリアクションできない', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {
				noteId: '000000000000000000000000',
				reaction: 'like'
			}, me);

			assert.strictEqual(res.status, 400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {}, me);

			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const me = await signup();

			const res = await request('/notes/reactions/create', {
				noteId: 'kyoppie',
				reaction: 'like'
			}, me);

			assert.strictEqual(res.status, 400);
		}));
	});

	describe('following/create', () => {
		it('フォローできる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/following/create', {
				userId: alice.id
			}, bob);

			assert.strictEqual(res.status, 200);
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

			assert.strictEqual(res.status, 400);
		}));

		it('存在しないユーザーはフォローできない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: '000000000000000000000000'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('自分自身はフォローできない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: alice.id
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/create', {
				userId: 'foo'
			}, alice);

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 200);
		}));

		it('フォローしていない場合は怒る', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/following/delete', {
				userId: alice.id
			}, bob);

			assert.strictEqual(res.status, 400);
		}));

		it('存在しないユーザーはフォロー解除できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: '000000000000000000000000'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('自分自身はフォロー解除できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: alice.id
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('空のパラメータで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/following/delete', {
				userId: 'kyoppie'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));
	});

	describe('drive', () => {
		it('ドライブ情報を取得できる', async(async () => {
			const bob = await signup({ username: 'bob' });
			await uploadFile({
				userId: me.id,
				size: 256
			});
			await uploadFile({
				userId: me.id,
				size: 512
			});
			await uploadFile({
				userId: me.id,
				size: 1024
			});
			const res = await request('/drive', {}, me);
			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			expect(res.body).have.property('usage').eql(1792);
		}));
	});

	describe('drive/files/create', () => {
		it('ファイルを作成できる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await uploadFile(alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'Lenna.png');
		}));

		it('ファイルに名前を付けられる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await assert.request(server)
				.post('/drive/files/create')
				.field('i', alice.token)
				.field('name', 'Belmond.png')
				.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');

			expect(res).have.status(200);
			expect(res.body).be.a('object');
			expect(res.body).have.property('name').eql('Belmond.png');
		}));

		it('ファイル無しで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/create', {}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('SVGファイルを作成できる', async(async () => {
			const izumi = await signup({ username: 'izumi' });

			const res = await uploadFile(izumi, __dirname + '/resources/image.svg');

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'image.svg');
			assert.strictEqual(res.body.type, 'image/svg+xml');
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, newName);
		}));

		it('他人のファイルは更新できない', async(async () => {
			const bob = await signup({ username: 'bob' });
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(bob);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				name: 'いちごパスタ.png'
			}, alice);

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.folderId, folder.id);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.folderId, null);
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

			assert.strictEqual(res.status, 400);
		}));

		it('存在しないフォルダで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: '000000000000000000000000'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const file = await uploadFile(alice);

			const res = await request('/drive/files/update', {
				fileId: file.id,
				folderId: 'foo'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('ファイルが存在しなかったら怒る', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/update', {
				fileId: '000000000000000000000000',
				name: 'いちごパスタ.png'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('間違ったIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/files/update', {
				fileId: 'kyoppie',
				name: 'いちごパスタ.png'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));
	});

	describe('drive/folders/create', () => {
		it('フォルダを作成できる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/create', {
				name: 'test'
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'test');
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.name, 'new name');
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

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.parentId, parentFolder.id);
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

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.parentId, null);
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

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 400);
		}));

		it('フォルダが循環するような構造にできない(自身)', async(async () => {
			const arisugawa = await signup({ username: 'arisugawa' });
			const folderA = (await request('/drive/folders/create', {
				name: 'test'
			}, arisugawa)).body;

			const res = await request('/drive/folders/update', {
				folderId: folderA.id,
				parentId: folderA.id
			}, arisugawa);

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 400);
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

			assert.strictEqual(res.status, 400);
		}));

		it('存在しないフォルダを更新できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/update', {
				folderId: '000000000000000000000000'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('不正なフォルダIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/drive/folders/update', {
				folderId: 'foo'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));
	});

	describe('messaging/messages/create', () => {
		it('メッセージを送信できる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/messaging/messages/create', {
				userId: bob.id,
				text: 'test'
			}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(typeof res.body === 'object' && !Array.isArray(res.body), true);
			assert.strictEqual(res.body.text, 'test');
		}));

		it('自分自身にはメッセージを送信できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/messaging/messages/create', {
				userId: alice.id,
				text: 'Yo'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('存在しないユーザーにはメッセージを送信できない', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/messaging/messages/create', {
				userId: '000000000000000000000000',
				text: 'test'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('不正なユーザーIDで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });

			const res = await request('/messaging/messages/create', {
				userId: 'foo',
				text: 'test'
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('テキストが無くて怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/messaging/messages/create', {
				userId: bob.id
			}, alice);

			assert.strictEqual(res.status, 400);
		}));

		it('文字数オーバーで怒られる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const res = await request('/messaging/messages/create', {
				userId: bob.id,
				text: '!'.repeat(1001)
			}, alice);

			assert.strictEqual(res.status, 400);
		}));
	});

	describe('notes/replies', () => {
		it('自分に閲覧権限のない投稿は含まれない', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });
			const carol = await signup({ username: 'carol' });

			const alicePost = await post(alice, {
				text: 'foo'
			});

			await post(bob, {
				replyId: alicePost.id,
				text: 'bar',
				visibility: 'specified',
				visibleUserIds: [alice.id]
			});

			const res = await request('/notes/replies', {
				noteId: alicePost.id
			}, carol);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 0);
		}));
	});

	describe('notes/timeline', () => {
		it('フォロワー限定投稿が含まれる', async(async () => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			await request('/following/create', {
				userId: alice.id
			}, bob);

			const alicePost = await post(alice, {
				text: 'foo',
				visibility: 'followers'
			});

			const res = await request('/notes/timeline', {}, bob);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.length, 1);
			assert.strictEqual(res.body[0].id, alicePost.id);
		}));
	});
});
*/
