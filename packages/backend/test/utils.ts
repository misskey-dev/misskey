import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as childProcess from 'child_process';
import * as http from 'node:http';
import { SIGKILL } from 'constants';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { DataSource } from 'typeorm';
import got, { RequestError } from 'got';
import loadConfig from '../src/config/load.js';
import { entities } from '@/postgres.js';
import type * as misskey from 'misskey-js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const config = loadConfig();
export const port = config.port;

export const api = async (endpoint: string, params: any, me?: any) => {
	endpoint = endpoint.replace(/^\//, '');

	const auth = me ? {
		i: me.token,
	} : {};

	try {
		const res = await got<string>(`http://localhost:${port}/api/${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(Object.assign(auth, params)),
			retry: {
				limit: 0,
			},
		});

		const status = res.statusCode;
		const body = res.statusCode !== 204 ? await JSON.parse(res.body) : null;

		return {
			status,
			body,
		};
	} catch (err: unknown) {
		if (err instanceof RequestError && err.response) {
			const status = err.response.statusCode;
			const body = await JSON.parse(err.response.body as string);

			return {
				status,
				body,
			};
		} else {
			throw err;
		}
	}
};

export const request = async (path: string, params: any, me?: any): Promise<{ body: any, status: number }> => {
	const auth = me ? {
		i: me.token,
	} : {};

	const res = await fetch(`http://localhost:${port}/${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(Object.assign(auth, params)),
	});

	const status = res.status;
	const body = res.status === 200 ? await res.json().catch() : null;

	return {
		body, status,
	};
};

export const signup = async (params?: any): Promise<any> => {
	const q = Object.assign({
		username: 'test',
		password: 'test',
	}, params);

	const res = await api('signup', q);

	return res.body;
};

export const post = async (user: any, params?: misskey.Endpoints['notes/create']['req']): Promise<misskey.entities.Note> => {
	const q = Object.assign({
		text: 'test',
	}, params);

	const res = await api('notes/create', q, user);

	return res.body ? res.body.createdNote : null;
};

export const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await api('notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

/**
 * Upload file
 * @param user User
 * @param _path Optional, absolute path or relative from ./resources/
 */
export const uploadFile = async (user: any, _path?: string): Promise<any> => {
	const absPath = _path == null ? `${_dirname}/resources/Lenna.jpg` : path.isAbsolute(_path) ? _path : `${_dirname}/resources/${_path}`;

	const formData = new FormData() as any;
	formData.append('i', user.token);
	formData.append('file', fs.createReadStream(absPath));
	formData.append('force', 'true');

	const res = await got<string>(`http://localhost:${port}/api/drive/files/create`, {
		method: 'POST',
		body: formData,
		retry: {
			limit: 0,
		},
	});

	const body = res.statusCode !== 204 ? await JSON.parse(res.body) : null;

	return body;
};

export const uploadUrl = async (user: any, url: string) => {
	let file: any;
	const marker = Math.random().toString();

	const ws = await connectStream(user, 'main', (msg) => {
		if (msg.type === 'urlUploadFinished' && msg.body.marker === marker) {
			file = msg.body.file;
		}
	});

	await api('drive/files/upload-from-url', {
		url,
		marker,
		force: true,
	}, user);

	await sleep(7000);
	ws.close();

	return file;
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

export const waitFire = async (user: any, channel: string, trgr: () => any, cond: (msg: Record<string, any>) => boolean, params?: any) => {
	return new Promise<boolean>(async (res, rej) => {
		let timer: NodeJS.Timeout;

		let ws: WebSocket;
		try {
			ws = await connectStream(user, channel, msg => {
				if (cond(msg)) {
					ws.close();
					if (timer) clearTimeout(timer);
					res(true);
				}
			}, params);
		} catch (e) {
			rej(e);
		}

		if (!ws!) return;

		timer = setTimeout(() => {
			ws.close();
			res(false);
		}, 3000);

		try {
			await trgr();
		} catch (e) {
			ws.close();
			if (timer) clearTimeout(timer);
			rej(e);
		}
	});
};

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
		entities: initEntities ?? entities,
	});

	await db.initialize();

	return db;
}

export function startServer(timeout = 60 * 1000): Promise<childProcess.ChildProcess> {
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

export function shutdownServer(p: childProcess.ChildProcess | undefined, timeout = 20 * 1000) {
	if (p == null) return Promise.resolve('nop');
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

export function sleep(msec: number) {
	return new Promise<void>(res => {
		setTimeout(() => {
			res();
		}, msec);
	});
}
