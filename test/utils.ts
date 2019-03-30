import * as fs from 'fs';
import * as http from 'http';
import * as assert from 'chai';
import { Connection } from 'typeorm';
const fetch = require('node-fetch');

export const async = (fn: Function) => (done: Function) => {
	fn().then(() => {
		done();
	}, (err: Error) => {
		done(err);
	});
};

export const request = async (endpoint: string, params: any, me?: any): Promise<{ body: any, status: number }> => {
	const auth = me ? {
		i: me.token
	} : {};

	const res = await fetch('http://localhost:80/api' + endpoint, {
		method: 'POST',
		body: JSON.stringify(Object.assign(auth, params))
	});

	const status = res.status;
	const body = await res.json();

	return {
		body, status
	};
};

export const signup = async (params?: any): Promise<any> => {
	const q = Object.assign({
		username: 'test',
		password: 'test'
	}, params);

	const res = await request('/signup', q);

	return res.body;
};

export const post = async (user: any, params?: any): Promise<any> => {
	const q = Object.assign({
		text: 'test'
	}, params);

	const res = await request('/notes/create', q, user);

	return res.body.createdNote;
};

export const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await request('/notes/reactions/create', {
		noteId: note.id,
		reaction: reaction
	}, user);
};

export const uploadFile = (server: http.Server) => async (user: any): Promise<any> => {
	const res = await assert.request(server)
		.post('/drive/files/create')
		.field('i', user.token)
		.attach('file', fs.readFileSync(__dirname + '/resources/Lenna.png'), 'Lenna.png');

	return res.body;
};

export const resetDb = (connection: Connection) => () => new Promise(res => {
	// APIがなにかレスポンスを返した後に、後処理を行う場合があり、
	// レスポンスを受け取ってすぐデータベースをリセットすると
	// その後処理と競合し(テスト自体は合格するものの)エラーがコンソールに出力され
	// 見た目的に気持ち悪くなるので、後処理が終るのを待つために500msくらい待ってから
	// データベースをリセットするようにする
	setTimeout(async () => {
		await connection.dropDatabase();
		res();
	}, 500);
});
