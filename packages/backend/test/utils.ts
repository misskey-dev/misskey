import { readFile } from 'node:fs/promises';
import { isAbsolute, basename } from 'node:path';
import WebSocket from 'ws';
import fetch, { Blob, File, RequestInit } from 'node-fetch';
import { DataSource } from 'typeorm';
import { entities } from '../src/postgres.js';
import { loadConfig } from '../src/config.js';
import type * as misskey from 'misskey-js';

export { server as startServer } from '@/boot/common.js';

const config = loadConfig();
export const port = config.port;

export const api = async (endpoint: string, params: any, me?: any) => {
	const normalized = endpoint.replace(/^\//, '');
	return await request(`api/${normalized}`, params, me);
};

const request = async (path: string, params: any, me?: any): Promise<{ body: any, status: number }> => {
	const auth = me ? {
		i: me.token,
	} : {};

	const res = await relativeFetch(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(Object.assign(auth, params)),
		redirect: 'manual',
	});

	const status = res.status;
	const body = res.headers.get('content-type') === 'application/json; charset=utf-8'
		? await res.json()
		: null;

	return {
		body, status,
	};
};

const relativeFetch = async (path: string, init?: RequestInit | undefined) => {
	return await fetch(new URL(path, `http://127.0.0.1:${port}/`).toString(), init);
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
	const q = params;

	const res = await api('notes/create', q, user);

	return res.body ? res.body.createdNote : null;
};

export const react = async (user: any, note: any, reaction: string): Promise<any> => {
	await api('notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

interface UploadOptions {
	/** Optional, absolute path or relative from ./resources/ */
	path?: string | URL;
	/** The name to be used for the file upload */
	name?: string;
	/** A Blob can be provided instead of path */
	blob?: Blob;
}

/**
 * Upload file
 * @param user User
 */
export const uploadFile = async (user: any, { path, name, blob }: UploadOptions = {}): Promise<any> => {
	const absPath = path == null
		? new URL('resources/Lenna.jpg', import.meta.url)
		: isAbsolute(path.toString())
			? new URL(path)
			: new URL(path, new URL('resources/', import.meta.url));

	const formData = new FormData();
	formData.append('i', user.token);
	formData.append('file', blob ??
		new File([await readFile(absPath)], basename(absPath.toString())));
	formData.append('force', 'true');
	if (name) {
		formData.append('name', name);
	}

	const res = await relativeFetch('api/drive/files/create', {
		method: 'POST',
		body: formData,
	});

	const body = res.status !== 204 ? await res.json() : null;

	return {
		status: res.status,
		body,
	};
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
		const ws = new WebSocket(`ws://127.0.0.1:${port}/streaming?i=${user.token}`);

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
		let timer: NodeJS.Timeout | null = null;

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

export const simpleGet = async (path: string, accept = '*/*'): Promise<{ status: number, body: any, type: string | null, location: string | null }> => {
	const res = await relativeFetch(path, {
		headers: {
			Accept: accept,
		},
		redirect: 'manual',
	});

	const jsonTypes = [
		'application/json; charset=utf-8',
		'application/activity+json; charset=utf-8',
	];

	const body = jsonTypes.includes(res.headers.get('content-type') ?? '')
		? await res.json()
		: null;

	return {
		status: res.status,
		body,
		type: res.headers.get('content-type'),
		location: res.headers.get('location'),
	};
};

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

export function sleep(msec: number) {
	return new Promise<void>(res => {
		setTimeout(() => {
			res();
		}, msec);
	});
}
