import * as fs from 'fs';
import * as WebSocket from 'ws';
import { Connection } from 'typeorm';
const fetch = require('node-fetch');
const FormData = require('form-data');

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
	const body = await res.json().catch(() => null);

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

export const uploadFile = (user: any, path?: string): Promise<any> => new Promise((ok, rej) => {
	const form = new FormData();
	form.append('i', user.token);
	if (path) {
		form.append('file', fs.createReadStream(path));
	} else {
		form.append('file', fs.createReadStream(__dirname + '/resources/Lenna.png'));
	}
	form.submit('http://localhost:80/api/drive/files/create', (err, res) => {
		ok({
			status: res.statusCode,
			body: res.body
		});
	});
});

export function connectStream(user: any, channel: string, listener: any): Promise<WebSocket> {
	return new Promise((res, rej) => {
		const ws = new WebSocket(`ws://localhost/streaming?i=${user.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type == 'channel' && msg.body.id == 'a') {
					listener(msg.body);
				} else if (msg.type == 'connected' && msg.body.id == 'a') {
					res(ws);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: channel,
					id: 'a',
					pong: true
				}
			}));
		});
	});
}
