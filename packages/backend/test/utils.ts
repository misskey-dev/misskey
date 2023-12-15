/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { isAbsolute, basename } from 'node:path';
import { inspect } from 'node:util';
import WebSocket, { ClientOptions } from 'ws';
import fetch, { File, RequestInit } from 'node-fetch';
import { DataSource } from 'typeorm';
import { JSDOM } from 'jsdom';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import { entities } from '../src/postgres.js';
import { loadConfig } from '../src/config.js';
import type * as misskey from 'misskey-js';

export { server as startServer } from '@/boot/common.js';

interface UserToken {
	token: string;
	bearer?: boolean;
}

const config = loadConfig();
export const port = config.port;

export const cookie = (me: UserToken): string => {
	return `token=${me.token};`;
};

export const api = async (endpoint: string, params: any, me?: UserToken) => {
	const normalized = endpoint.replace(/^\//, '');
	return await request(`api/${normalized}`, params, me);
};

export type ApiRequest = {
	endpoint: string,
	parameters: object,
	user: UserToken | undefined,
};

export const successfulApiCall = async <T, >(request: ApiRequest, assertion: {
	status?: number,
} = {}): Promise<T> => {
	const { endpoint, parameters, user } = request;
	const res = await api(endpoint, parameters, user);
	const status = assertion.status ?? (res.body == null ? 204 : 200);
	assert.strictEqual(res.status, status, inspect(res.body, { depth: 5, colors: true }));
	return res.body;
};

export const failedApiCall = async <T, >(request: ApiRequest, assertion: {
	status: number,
	code: string,
	id: string
}): Promise<T> => {
	const { endpoint, parameters, user } = request;
	const { status, code, id } = assertion;
	const res = await api(endpoint, parameters, user);
	assert.strictEqual(res.status, status, inspect(res.body));
	assert.strictEqual(res.body.error.code, code, inspect(res.body));
	assert.strictEqual(res.body.error.id, id, inspect(res.body));
	return res.body;
};

const request = async (path: string, params: any, me?: UserToken): Promise<{ status: number, headers: Headers, body: any }> => {
	const bodyAuth: Record<string, string> = {};
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (me?.bearer) {
		headers.Authorization = `Bearer ${me.token}`;
	} else if (me) {
		bodyAuth.i = me.token;
	}

	const res = await relativeFetch(path, {
		method: 'POST',
		headers,
		body: JSON.stringify(Object.assign(bodyAuth, params)),
		redirect: 'manual',
	});

	const body = res.headers.get('content-type') === 'application/json; charset=utf-8'
		? await res.json()
		: null;

	return {
		status: res.status,
		headers: res.headers,
		body,
	};
};

export const relativeFetch = async (path: string, init?: RequestInit | undefined) => {
	return await fetch(new URL(path, `http://127.0.0.1:${port}/`).toString(), init);
};

export function randomString(chars = 'abcdefghijklmnopqrstuvwxyz0123456789', length = 16) {
	let randomString = '';
	for (let i = 0; i < length; i++) {
		randomString += chars[Math.floor(Math.random() * chars.length)];
	}
	return randomString;
}

export const signup = async (params?: Partial<misskey.Endpoints['signup']['req']>): Promise<NonNullable<misskey.Endpoints['signup']['res']>> => {
	const q = Object.assign({
		username: randomString(),
		password: 'test',
	}, params);

	const res = await api('signup', q);

	return res.body;
};

export const post = async (user: UserToken, params?: misskey.Endpoints['notes/create']['req']): Promise<misskey.entities.Note> => {
	const q = params;

	const res = await api('notes/create', q, user);

	return res.body ? res.body.createdNote : null;
};

// 非公開ノートをAPI越しに見たときのノート NoteEntityService.ts
export const hiddenNote = (note: any): any => {
	const temp = {
		...note,
		fileIds: [],
		files: [],
		text: null,
		cw: null,
		isHidden: true,
	};
	delete temp.visibleUserIds;
	delete temp.poll;
	return temp;
};

export const react = async (user: UserToken, note: any, reaction: string): Promise<any> => {
	await api('notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

export const userList = async (user: UserToken, userList: any = {}): Promise<any> => {
	const res = await api('users/lists/create', {
		name: 'test',
	}, user);
	return res.body;
};

export const page = async (user: UserToken, page: any = {}): Promise<any> => {
	const res = await api('pages/create', {
		alignCenter: false,
		content: [
			{
				id: '2be9a64b-5ada-43a3-85f3-ec3429551ded',
				text: 'Hello World!',
				type: 'text',
			},
		],
		eyeCatchingImageId: null,
		font: 'sans-serif',
		hideTitleWhenPinned: false,
		name: '1678594845072',
		script: '',
		summary: null,
		title: '',
		variables: [],
		...page,
	}, user);
	return res.body;
};

export const play = async (user: UserToken, play: any = {}): Promise<any> => {
	const res = await api('flash/create', {
		permissions: [],
		script: 'test',
		summary: '',
		title: 'test',
		...play,
	}, user);
	return res.body;
};

export const clip = async (user: UserToken, clip: any = {}): Promise<any> => {
	const res = await api('clips/create', {
		description: null,
		isPublic: true,
		name: 'test',
		...clip,
	}, user);
	return res.body;
};

export const galleryPost = async (user: UserToken, channel: any = {}): Promise<any> => {
	const res = await api('gallery/posts/create', {
		description: null,
		fileIds: [],
		isSensitive: false,
		title: 'test',
		...channel,
	}, user);
	return res.body;
};

export const channel = async (user: UserToken, channel: any = {}): Promise<any> => {
	const res = await api('channels/create', {
		bannerId: null,
		description: null,
		name: 'test',
		...channel,
	}, user);
	return res.body;
};

export const role = async (user: UserToken, role: any = {}, policies: any = {}): Promise<any> => {
	const res = await api('admin/roles/create', {
		asBadge: false,
		canEditMembersByModerator: false,
		color: null,
		condFormula: {
			id: 'ebef1684-672d-49b6-ad82-1b3ec3784f85',
			type: 'isRemote',
		},
		description: '',
		displayOrder: 0,
		iconUrl: null,
		isAdministrator: false,
		isModerator: false,
		isPublic: false,
		name: 'New Role',
		target: 'manual',
		policies: {
			...Object.entries(DEFAULT_POLICIES).map(([k, v]) => [k, {
				priority: 0,
				useDefault: true,
				value: v,
			}]),
			...policies,
		},
		...role,
	}, user);
	return res.body;
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
export const uploadFile = async (user?: UserToken, { path, name, blob }: UploadOptions = {}): Promise<{ status: number, headers: Headers, body: misskey.Endpoints['drive/files/create']['res'] | null }> => {
	const absPath = path == null
		? new URL('resources/Lenna.jpg', import.meta.url)
		: isAbsolute(path.toString())
			? new URL(path)
			: new URL(path, new URL('resources/', import.meta.url));

	const formData = new FormData();
	formData.append('file', blob ??
		new File([await readFile(absPath)], basename(absPath.toString())));
	formData.append('force', 'true');
	if (name) {
		formData.append('name', name);
	}

	const headers: Record<string, string> = {};
	if (user?.bearer) {
		headers.Authorization = `Bearer ${user.token}`;
	} else if (user) {
		formData.append('i', user.token);
	}

	const res = await relativeFetch('api/drive/files/create', {
		method: 'POST',
		body: formData,
		headers,
	});

	const body = res.status !== 204 ? await res.json() as misskey.Endpoints['drive/files/create']['res'] : null;

	return {
		status: res.status,
		headers: res.headers,
		body,
	};
};

export const uploadUrl = async (user: UserToken, url: string) => {
	let resolve: unknown;
	const file = new Promise(ok => resolve = ok);
	const marker = Math.random().toString();

	const ws = await connectStream(user, 'main', (msg) => {
		if (msg.type === 'urlUploadFinished' && msg.body.marker === marker) {
			ws.close();
			resolve(msg.body.file);
		}
	});

	await api('drive/files/upload-from-url', {
		url,
		marker,
		force: true,
	}, user);

	return file;
};

export function connectStream(user: UserToken, channel: string, listener: (message: Record<string, any>) => any, params?: any): Promise<WebSocket> {
	return new Promise((res, rej) => {
		const url = new URL(`ws://127.0.0.1:${port}/streaming`);
		const options: ClientOptions = {};
		if (user.bearer) {
			options.headers = { Authorization: `Bearer ${user.token}` };
		} else {
			url.searchParams.set('i', user.token);
		}
		const ws = new WebSocket(url, options);

		ws.on('unexpected-response', (req, res) => rej(res));
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

export const waitFire = async (user: UserToken, channel: string, trgr: () => any, cond: (msg: Record<string, any>) => boolean, params?: any) => {
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

export type SimpleGetResponse = {
	status: number,
	body: any | JSDOM | null,
	type: string | null,
	location: string | null
};
export const simpleGet = async (path: string, accept = '*/*', cookie: any = undefined): Promise<SimpleGetResponse> => {
	const res = await relativeFetch(path, {
		headers: {
			Accept: accept,
			Cookie: cookie,
		},
		redirect: 'manual',
	});

	const jsonTypes = [
		'application/json; charset=utf-8',
		'application/activity+json; charset=utf-8',
	];
	const htmlTypes = [
		'text/html; charset=utf-8',
	];

	const body =
		jsonTypes.includes(res.headers.get('content-type') ?? '')	? await res.json() :
		htmlTypes.includes(res.headers.get('content-type') ?? '')	? new JSDOM(await res.text()) :
		null;

	return {
		status: res.status,
		body,
		type: res.headers.get('content-type'),
		location: res.headers.get('location'),
	};
};

/**
 * あるAPIエンドポイントのPaginationが複数の条件で一貫した挙動であることをテストします。
 * (sinceId, untilId, sinceDate, untilDate, offset, limit)
 * @param expected 期待値となるEntityの並び（例：Note[]）昇順降順が一致している必要がある
 * @param fetchEntities Entity[]を返却するテスト対象のAPIを呼び出す関数
 * @param offsetBy 何をキーとしてPaginationするか。
 * @param ordering 昇順・降順
 */
export async function testPaginationConsistency<Entity extends { id: string, createdAt?: string }>(
	expected: Entity[],
	fetchEntities: (paginationParam: {
		limit?: number,
		offset?: number,
		sinceId?: string,
		untilId?: string,
		sinceDate?: number,
		untilDate?: number,
	}) => Promise<Entity[]>,
	offsetBy: 'offset' | 'id' | 'createdAt' = 'id',
	ordering: 'desc' | 'asc' = 'desc'): Promise<void> {
	const rangeToParam = (p: { limit?: number, until?: Entity, since?: Entity }): object => {
		if (offsetBy === 'id') {
			return { limit: p.limit, sinceId: p.since?.id, untilId: p.until?.id };
		} else {
			const sinceDate = p.since?.createdAt !== undefined ? new Date(p.since.createdAt).getTime() : undefined;
			const untilDate = p.until?.createdAt !== undefined ? new Date(p.until.createdAt).getTime() : undefined;
			return { limit: p.limit, sinceDate, untilDate };
		}
	};

	for (const limit of [1, 5, 10, 100, undefined]) {
		/*
		// 1. sinceId/DateとuntilId/Dateで両端を指定して取得した結果が期待通りになっていること
		if (ordering === 'desc') {
			const end = expected.at(-1)!;
			let last = await fetchEntities(rangeToParam({ limit, since: end }));
			const actual: Entity[] = [];
			while (last.length !== 0) {
				actual.push(...last);
				last = await fetchEntities(rangeToParam({ limit, until: last.at(-1), since: end }));
			}
			actual.push(end);
			assert.deepStrictEqual(
				actual.map(({ id, createdAt }) => id + ':' + createdAt),
				expected.map(({ id, createdAt }) => id + ':' + createdAt));
		}

		// 2. sinceId/Date指定+limitで取得してつなぎ合わせた結果が期待通りになっていること
		if (ordering === 'asc') {
			// 昇順にしたときの先頭(一番古いもの)をもってくる（expected[1]を基準に降順にして0番目）
			let last = await fetchEntities({ limit: 1, untilId: expected[1].id });
			const actual: Entity[] = [];
			while (last.length !== 0) {
				actual.push(...last);
				last = await fetchEntities(rangeToParam({ limit, since: last.at(-1) }));
			}
			assert.deepStrictEqual(
				actual.map(({ id, createdAt }) => id + ':' + createdAt),
				expected.map(({ id, createdAt }) => id + ':' + createdAt));
		}
		*/

		// 3. untilId指定+limitで取得してつなぎ合わせた結果が期待通りになっていること
		if (ordering === 'desc') {
			let last = await fetchEntities({ limit });
			const actual: Entity[] = [];
			while (last.length !== 0) {
				actual.push(...last);
				last = await fetchEntities(rangeToParam({ limit, until: last.at(-1) }));
			}
			assert.deepStrictEqual(
				actual.map(({ id, createdAt }) => id + ':' + createdAt),
				expected.map(({ id, createdAt }) => id + ':' + createdAt));
		}

		// 4. offset指定+limitで取得してつなぎ合わせた結果が期待通りになっていること
		if (offsetBy === 'offset') {
			let last = await fetchEntities({ limit, offset: 0 });
			let offset = limit ?? 10;
			const actual: Entity[] = [];
			while (last.length !== 0) {
				actual.push(...last);
				last = await fetchEntities({ limit, offset });
				offset += limit ?? 10;
			}
			assert.deepStrictEqual(
				actual.map(({ id, createdAt }) => id + ':' + createdAt),
				expected.map(({ id, createdAt }) => id + ':' + createdAt));
		}
	}
}

export async function initTestDb(justBorrow = false, initEntities?: any[]) {
	if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV is not a test');

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
