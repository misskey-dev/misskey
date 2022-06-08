import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as childProcess from 'child_process';
import * as http from 'node:http';
import { SIGKILL } from 'constants';
import * as WebSocket from 'ws';
import * as misskey from 'misskey-js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { DataSource } from 'typeorm';
import loadConfig from '../src/config/load.js';
import { entities } from '../src/db/postgre.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const config = loadConfig();
export const port = config.port;

export const async = (fn: Function) => (done: Function) => {
	fn().then(() => {
		done();
	}, (err: Error) => {
		done(err);
	});
};

export const request = async (endpoint: string, params: any, me?: any): Promise<{ body: any, status: number }> => {
	const auth = me ? {
		i: me.token,
	} : {};

	const res = await fetch(`http://localhost:${port}/api${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(Object.assign(auth, params)),
	});

	const status = res.status;
	const body = res.status !== 204 ? await res.json().catch() : null;

	return {
		body, status,
	};
};

export const signup = async (params?: any): Promise<any> => {
	const q = Object.assign({
		username: 'test',
		password: 'test',
	}, params);

	const res = await request('/signup', q);

	return res.body;
};

export const post = async (user: any, params?: misskey.Endpoints['notes/create']['req']): Promise<misskey.entities.Note> => {
	const q = Object.assign({
		text: 'test',
	}, params);

	const res = await request('/notes/create', q, user);

	return res.body ? res.body.createdNote : null;
};

export const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await request('/notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

export const uploadFile = (user: any, path?: string): Promise<any> => {
	const formData = new FormData();
	formData.append('i', user.token);
	formData.append('file', fs.createReadStream(path || _dirname + '/resources/Lenna.png'));

	return fetch(`http://localhost:${port}/api/drive/files/create`, {
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
};

export function connectStream(user: any, channel: string, listener: (message: Record<string, any>) => any, params?: any): Promise<WebSocket> {
	return new Promise((res, rej) => {
		const ws = new WebSocket(`ws://localhost:${port}/streaming?i=${user.token}`);

		ws.on('open', () => {
			ws.on('message', data => {
				const msg = JSON.parse(data.toString());
				if (msg.type === 'channel' && msg.body.id === 'a') {
					listener(msg.body);
				} else if (msg.type === 'connected' && msg.body.id === 'a') {
					res(ws);
				}
			});

			ws.send(JSON.stringify({
				type: 'connect',
				body: {
					channel: channel,
					id: 'a',
					pong: true,
					params: params,
				},
			}));
		});
	});
}

export const simpleGet = async (path: string, accept = '*/*'): Promise<{ status?: number, type?: string, location?: string }> => {
	// node-fetchだと3xxを取れない
	return await new Promise((resolve, reject) => {
		const req = http.request(`http://localhost:${port}${path}`, {
			headers: {
				Accept: accept,
			},
		}, res => {
			if (res.statusCode! >= 400) {
				reject(res);
			} else {
				resolve({
					status: res.statusCode,
					type: res.headers['content-type'],
					location: res.headers.location,
				});
			}
		});

		req.end();
	});
};

export function launchServer(callbackSpawnedProcess: (p: childProcess.ChildProcess) => void, moreProcess: () => Promise<void> = async () => {}) {
	return (done: (err?: Error) => any) => {
		const p = childProcess.spawn('node', [_dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test', PATH: process.env.PATH },
		});
		callbackSpawnedProcess(p);
		p.on('message', message => {
			if (message === 'ok') moreProcess().then(() => done()).catch(e => done(e));
		});
	};
}

export async function initTestDb(justBorrow = false, initEntities?: any[]) {
	if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

	const db = new DataSource({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true && !justBorrow,
		dropSchema: true && !justBorrow,
		entities: initEntities || entities,
	});

	await db.initialize();

	return db;
}

export function startServer(timeout = 30 * 1000): Promise<childProcess.ChildProcess> {
	return new Promise((res, rej) => {
		const t = setTimeout(() => {
			p.kill(SIGKILL);
			rej('timeout to start');
		}, timeout);

		const p = childProcess.spawn('node', [_dirname + '/../built/index.js'], {
			stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test', PATH: process.env.PATH },
		});

		p.on('error', e => rej(e));

		p.on('message', message => {
			if (message === 'ok') {
				clearTimeout(t);
				res(p);
			}
		});
	});
}

export function shutdownServer(p: childProcess.ChildProcess, timeout = 20 * 1000) {
	return new Promise((res, rej) => {
		const t = setTimeout(() => {
			p.kill(SIGKILL);
			res('force exit');
		}, timeout);

		p.once('exit', () => {
			clearTimeout(t);
			res('exited');
		});

		p.kill();
	});
}
