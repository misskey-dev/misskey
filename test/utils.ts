import * as fs from 'fs';
import * as WebSocket from 'ws';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as childProcess from 'child_process';

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

	try {
		const res = await fetch('http://localhost:8080/api' + endpoint, {
			method: 'POST',
			body: JSON.stringify(Object.assign(auth, params))
		});

		const status = res.status;
		const body = res.status !== 204 ? await res.json().catch() : null;

		return {
			body, status
		};
	} catch (e) {
		return {
			body: null, status: 500
		};
	}
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

	return res.body ? res.body.createdNote : null;
};

export const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await request('/notes/reactions/create', {
		noteId: note.id,
		reaction: reaction
	}, user);
};

export const uploadFile = (user: any, path?: string): Promise<any> => new Promise((ok, rej) => {
		const formData = new FormData();
		formData.append('i', user.token);
		formData.append('file', fs.createReadStream(path || __dirname + '/resources/Lenna.png'));

		return fetch('http://localhost:8080/api/drive/files/create', {
			method: 'post',
			body: formData,
			timeout: 30 * 1000,
		}).then(res => {
			if (!res.ok) {
				throw `${res.status} ${res.statusText}`;
			} else {
				return res.json();
			}
		});
});

export function connectStream(user: any, channel: string, listener: (message: Record<string, any>) => any, params?: any): Promise<WebSocket> {
	return new Promise((res, rej) => {
		const ws = new WebSocket(`ws://localhost:8080/streaming?i=${user.token}`);

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
					pong: true,
					params: params
				}
			}));
		});
	});
}

export function launchServer(callbackSpawnedProcess: (p: childProcess.ChildProcess) => void, moreProcess: () => Promise<void> = async () => {}) {
	return (done: (err?: Error) => any) => {
		const p = childProcess.spawn('node', [__dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test', PATH: process.env.PATH }
		});
		callbackSpawnedProcess(p);
		p.on('message', message => {
			if (message === 'ok') moreProcess().then(() => done()).catch(e => done(e));
		});
	};
}
