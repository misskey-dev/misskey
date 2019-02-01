import * as fs from 'fs';
import * as http from 'http';
import * as assert from 'chai';
assert.use(require('chai-http'));

export const async = (fn: Function) => (done: Function) => {
	fn().then(() => {
		done();
	}, (err: Error) => {
		done(err);
	});
};

export const _request = (server: http.Server) => async (endpoint: string, params: any, me?: any): Promise<ChaiHttp.Response> => {
	const auth = me ? {
		i: me.token
	} : {};

	const res = await assert.request(server)
		.post(endpoint)
		.send(Object.assign(auth, params));

	return res;
};

export const _signup = (request: ReturnType<typeof _request>) => async (params?: any): Promise<any> => {
	const q = Object.assign({
		username: 'test',
		password: 'test'
	}, params);

	const res = await request('/signup', q);

	return res.body;
};

export const _post = (request: ReturnType<typeof _request>) => async (user: any, params?: any): Promise<any> => {
	const q = Object.assign({
		text: 'test'
	}, params);

	const res = await request('/notes/create', q, user);

	return res.body.createdNote;
};

export const _react = (request: ReturnType<typeof _request>) => async (user: any, note: any, reaction: string): Promise<any> => {
	await request('/notes/reactions/create', {
		noteId: note.id,
		reaction: reaction
	}, user);
};

export const _uploadFile = (server: http.Server) => async (user: any): Promise<any> => {
	const res = await assert.request(server)
		.post('/drive/files/create')
		.field('i', user.token)
		.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');

	return res.body;
};

export const resetDb = (db: any) => () => new Promise(res => {
	// APIがなにかレスポンスを返した後に、後処理を行う場合があり、
	// レスポンスを受け取ってすぐデータベースをリセットすると
	// その後処理と競合し(テスト自体は合格するものの)エラーがコンソールに出力され
	// 見た目的に気持ち悪くなるので、後処理が終るのを待つために500msくらい待ってから
	// データベースをリセットするようにする
	setTimeout(async () => {
		await Promise.all([
			db.get('users').drop(),
			db.get('notes').drop(),
			db.get('driveFiles.files').drop(),
			db.get('driveFiles.chunks').drop(),
			db.get('driveFolders').drop(),
			db.get('apps').drop(),
			db.get('accessTokens').drop(),
			db.get('authSessions').drop()
		]);

		res();
	}, 500);
});
