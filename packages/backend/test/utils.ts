/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { basename, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { inspect } from 'node:util';
import WebSocket, { ClientOptions } from 'ws';
import fetch, { Blob, FormData } from 'node-fetch';
import type { RequestInit, Headers, Response } from 'node-fetch';
import * as htmlParser from 'node-html-parser';
import { DataSource } from 'typeorm';
import Fastify from 'fastify';
import * as OTPAuth from 'otpauth';
import { entities } from '@/postgres.js';
import { loadConfig } from '@/config.js';
import type * as misskey from 'misskey-js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import { validateContentTypeSetAsActivityPub } from '@/core/activitypub/misc/validator.js';
import { ApiError } from '@/server/api/error.js';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';

export { server as startServer, jobQueue as startJobQueue } from '@/boot/common.js';

export interface UserToken {
	token: string;
	bearer?: boolean;
}

export type SystemWebhookPayload = {
	server: string;
	hookId: string;
	eventId: string;
	createdAt: string;
	type: string;
	body: any;
};

const config = loadConfig();
export const port = config.port;
export const origin = config.url;
export const host = new URL(config.url).host;

export const WEBHOOK_HOST = 'http://localhost:15080';
export const WEBHOOK_PORT = 15080;

export type ApiRequest<E extends keyof misskey.Endpoints, P extends misskey.Endpoints[E]['req'] = misskey.Endpoints[E]['req']> = {
	endpoint: E,
	parameters: P,
	user: UserToken | undefined,
};

export const successfulApiCall = async <E extends keyof misskey.Endpoints, P extends misskey.Endpoints[E]['req']>(request: ApiRequest<E, P>, assertion: {
	status?: number,
} = {}): Promise<misskey.api.SwitchCaseResponseType<E, P>> => {
	const { endpoint, parameters, user } = request;
	const res = await api(endpoint, parameters, user);
	const status = assertion.status ?? (res.body == null ? 204 : 200);
	assert.strictEqual(res.status, status, inspect(res.body, { depth: 5, colors: true }));

	return res.body as misskey.api.SwitchCaseResponseType<E, P>;
};

export const failedApiCall = async <E extends keyof misskey.Endpoints, P extends misskey.Endpoints[E]['req']>(request: ApiRequest<E, P>, assertion: {
	status: number,
	code: string,
	id: string
}): Promise<void> => {
	const { endpoint, parameters, user } = request;
	const { status, code, id } = assertion;
	const res = await api(endpoint, parameters, user);
	assert.strictEqual(res.status, status, inspect(res.body));
	assert.ok(res.body);
	assert.strictEqual(castAsError(res.body as any).error.code, code, inspect(res.body));
	assert.strictEqual(castAsError(res.body as any).error.id, id, inspect(res.body));
};

export const api = async <E extends keyof misskey.Endpoints, P extends misskey.Endpoints[E]['req']>(path: E, params: P, me?: UserToken): Promise<{
	status: number,
	headers: Headers,
	body: misskey.api.SwitchCaseResponseType<E, P>
}> => {
	const bodyAuth: Record<string, string> = {};
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (me?.bearer) {
		headers.Authorization = `Bearer ${me.token}`;
	} else if (me) {
		bodyAuth.i = me.token;
	}

	const res = await relativeFetch(`api/${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(Object.assign(bodyAuth, params)),
		redirect: 'manual',
	});

	const body = res.headers.get('content-type') === 'application/json; charset=utf-8'
		? await res.json() as misskey.api.SwitchCaseResponseType<E, P>
		: null;

	return {
		status: res.status,
		headers: res.headers,
		// FIXME: removing this non-null assertion: requires better typing around empty response.
		body: body!,
	};
};

export const relativeFetch = async (path: string, init?: RequestInit | undefined) => {
	return await fetch(new URL(path, `http://127.0.0.1:${port}/`).toString(), init);
};

//#region /auth (サインイン)

/** `/auth` 配下のエラー応答。`/api` の `ApiError` とは違い `id` しか持たない */
export type AuthApiErrorResponse = { error: { id: string } };

/**
 * `/auth` 配下のエンドポイントを叩く、{@link api} の兄弟。
 * `/auth` は misskey-js の codegen に乗らないので、応答の型は呼び出し側が型引数で与える。
 */
export const authApi = async <T>(path: 'signin/init' | 'signin/continue', body: object): Promise<{
	status: number,
	headers: Headers,
	body: T,
}> => {
	const res = await relativeFetch(`auth/${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		redirect: 'manual',
	});

	const resBody = res.headers.get('content-type')?.startsWith('application/json') === true
		? await res.json() as T
		: null;

	return {
		status: res.status,
		headers: res.headers,
		// FIXME: removing this non-null assertion: requires better typing around empty response.
		body: resBody!,
	};
};

/** サインインが完了した応答 */
export type SigninFlowSuccess = Extract<misskey.entities.SigninContinueResponse, { finished: true }>;
/** まだ完了しておらず、次の手段を要求している応答 */
export type SigninFlowPending = Extract<misskey.entities.SigninContinueResponse, { finished: false }>;

/** サインインが完了した応答であることを表明する (以降 `id` / `i` を読める) */
export function assertSigninFinished(body: misskey.entities.SigninContinueResponse): asserts body is SigninFlowSuccess {
	assert.strictEqual(body.finished, true, inspect(body));
}

/** サインインがまだ完了していない応答であることを表明する (以降 `next` を読める) */
export function assertSigninPending(body: misskey.entities.SigninContinueResponse): asserts body is SigninFlowPending {
	assert.strictEqual(body.finished, false, inspect(body));
}

/** パスキーを要求している応答であることを表明し、その challenge (`passkeyOptions`) を返す */
export function assertPasskeyRequested(body: misskey.entities.SigninContinueResponse): PublicKeyCredentialRequestOptionsJSON {
	assertSigninPending(body);
	assert.ok(body.next === 'passkey' || body.next === 'totpOrPasskey', inspect(body));
	return body.passkeyOptions;
}

/**
 * サインインフローを最後まで駆動して結果を返す。トークンが欲しいだけのテスト向けで、
 * 途中の応答やエラーを検査したいテストは {@link authApi} を直接使うこと。
 */
export const signinFlow = async (params: {
	username: string,
	password?: string,
	/** TOTP の共有シークレット。渡すと TOTP のステップを自動で通す */
	totpSecret?: string,
	/**
	 * パスキーのステップを通す credential を作る関数 (challenge はサーバー発行のものを使う)。
	 * `password` を渡さずにこれだけを渡すとパスワードレスログインになる。
	 */
	credential?: (options: PublicKeyCredentialRequestOptionsJSON) => AuthenticationResponseJSON | Promise<AuthenticationResponseJSON>,
}): Promise<SigninFlowSuccess> => {
	const init = await authApi<misskey.entities.SigninInitResponse>('signin/init', {});
	assert.strictEqual(init.status, 200, inspect(init.body));

	const sessionId = init.body.sessionId;

	const step = async (body: object): Promise<misskey.entities.SigninContinueResponse> => {
		const res = await authApi<misskey.entities.SigninContinueResponse>('signin/continue', { sessionId, ...body });
		assert.strictEqual(res.status, 200, inspect(res.body));
		return res.body;
	};

	const totp = (): string => {
		assert.ok(params.totpSecret != null, `signinFlow: TOTP が要求されたが totpSecret が渡されていない: ${params.username}`);
		return OTPAuth.TOTP.generate({
			secret: OTPAuth.Secret.fromBase32(params.totpSecret),
			digits: 6,
		});
	};

	let res = params.password === undefined && params.credential != null
		? await step({ passkeyCredential: await params.credential(init.body.passkeyOptions) })
		: await step({ username: params.username });

	// 充足しうる手段はたかだか数個。フローが循環したときに無限ループしないよう上限を置く
	for (let i = 0; i < 4 && !res.finished; i++) {
		switch (res.next) {
			case 'password':
				assert.ok(params.password !== undefined, `signinFlow: パスワードが要求されたが渡されていない: ${params.username}`);
				res = await step({ password: params.password });
				break;
			case 'totp':
				res = await step({ token: totp() });
				break;
			case 'passkey':
			case 'totpOrPasskey':
				res = params.credential != null
					? await step({ passkeyCredential: await params.credential(res.passkeyOptions) })
					: await step({ token: totp() });
				break;
		}
	}

	assert.ok(res.finished, `signinFlow: サインインが完了しなかった: ${inspect(res)}`);
	return res;
};

//#endregion

export function randomString(chars = 'abcdefghijklmnopqrstuvwxyz0123456789', length = 16) {
	let randomString = '';
	for (let i = 0; i < length; i++) {
		randomString += chars[Math.floor(Math.random() * chars.length)];
	}
	return randomString;
}

/**
 * @brief プロミスにタイムアウト追加
 * @param p 待ち対象プロミス
 * @param timeout 待機ミリ秒
 */
function timeoutPromise<T>(p: Promise<T>, timeout: number): Promise<T> {
	return Promise.race([
		p,
		new Promise((reject) => {
			setTimeout(() => { reject(new Error('timed out')); }, timeout);
		}) as never,
	]);
}

export const signup = async (params?: Partial<misskey.Endpoints['signup']['req']>): Promise<NonNullable<misskey.Endpoints['signup']['res']>> => {
	const q = Object.assign({
		username: randomString(),
		password: 'test',
	}, params);

	const res = await api('signup', q);

	return res.body;
};

export const post = async (user: UserToken, params: misskey.Endpoints['notes/create']['req']): Promise<misskey.entities.Note> => {
	const q = params;

	const res = await api('notes/create', q, user);

	// FIXME: the return type should reflect this fact.
	return (res.body ? res.body.createdNote : null)!;
};

export const createAppToken = async (user: UserToken, permissions: (typeof misskey.permissions)[number][]) => {
	const res = await api('miauth/gen-token', {
		session: randomUUID(),
		permission: permissions,
	}, user);

	return (res.body as misskey.entities.MiauthGenTokenResponse).token;
};

// 非公開ノートをAPI越しに見たときのノート NoteEntityService.ts
export const hiddenNote = (note: misskey.entities.Note): misskey.entities.Note => {
	const temp: misskey.entities.Note = {
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

export const react = async (user: UserToken, note: misskey.entities.Note, reaction: string): Promise<void> => {
	await api('notes/reactions/create', {
		noteId: note.id,
		reaction: reaction,
	}, user);
};

export const userList = async (user: UserToken, userList: Partial<misskey.entities.UserList> = {}): Promise<misskey.entities.UserList> => {
	const res = await api('users/lists/create', {
		name: 'test',
		...userList,
	}, user);
	return res.body;
};

export const page = async (user: UserToken, page: Partial<misskey.entities.Page> = {}): Promise<misskey.entities.Page> => {
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
		font: 'sans-serif' as any,
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

export const play = async (user: UserToken, play: Partial<misskey.entities.Flash> = {}): Promise<misskey.entities.Flash> => {
	const res = await api('flash/create', {
		permissions: [],
		script: 'test',
		summary: '',
		title: 'test',
		...play,
	}, user);
	return res.body;
};

export const clip = async (user: UserToken, clip: Partial<misskey.entities.Clip> = {}): Promise<misskey.entities.Clip> => {
	const res = await api('clips/create', {
		description: null,
		isPublic: true,
		name: 'test',
		...clip,
	}, user);
	return res.body;
};

export const galleryPost = async (user: UserToken, galleryPost: Partial<misskey.entities.GalleryPost> = {}): Promise<misskey.entities.GalleryPost> => {
	const res = await api('gallery/posts/create', {
		description: null,
		fileIds: [],
		isSensitive: false,
		title: 'test',
		...galleryPost,
	}, user);
	return res.body;
};

export const channel = async (user: UserToken, channel: Partial<misskey.entities.Channel> = {}): Promise<misskey.entities.Channel> => {
	const res = await api('channels/create', {
		bannerId: null,
		description: null,
		name: 'test',
		...channel,
	}, user);
	return res.body;
};

export const role = async (user: UserToken, role: Partial<misskey.entities.Role> = {}, policies: any = {}): Promise<misskey.entities.Role> => {
	const res = await api('admin/roles/create', {
		asBadge: false,
		canEditMembersByModerator: false,
		color: null,
		condFormula: {
			id: 'ebef1684-672d-49b6-ad82-1b3ec3784f85',
			type: 'isRemote',
		} as any,
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
export const uploadFile = async (user?: UserToken, { path, name, blob }: UploadOptions = {}): Promise<{
	status: number,
	headers: Headers,
	body: misskey.entities.DriveFile | null
}> => {
	const absPath = path == null
		? new URL('resources/192.jpg', import.meta.url)
		: isAbsolute(path.toString())
			? new URL(path)
			: new URL(path, new URL('resources/', import.meta.url));

	const formData = new FormData();
	formData.append(
		'file',
		blob ?? new Blob([new Uint8Array(await readFile(absPath))]),
		basename(absPath.toString()),
	);

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

export const uploadUrl = async (user: UserToken, url: string): Promise<misskey.entities.DriveFile> => {
	const marker = Math.random().toString();

	const catcher = makeStreamCatcher(
		user,
		'main',
		(msg) => msg.type === 'urlUploadFinished' && msg.body.marker === marker,
		(msg) => msg.body.file,
		60 * 1000,
	);

	await api('drive/files/upload-from-url', {
		url,
		marker,
		force: true,
	}, user);

	return catcher;
};

export function connectStream<C extends keyof misskey.Channels>(user: UserToken, channel: C, listener: (message: Record<string, any>) => any, params?: misskey.Channels[C]['params']): Promise<WebSocket> {
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

export const waitFire = async <C extends keyof misskey.Channels>(user: UserToken, channel: C, trgr: () => any, cond: (msg: Record<string, any>) => boolean, params?: misskey.Channels[C]['params']) => {
	let ws: WebSocket | undefined;

	try {
		let callback: (msg: Record<string, unknown>) => void;
		const receivedPromise = new Promise<boolean>((resolve) => {
			callback = (msg: Record<string, unknown>) => {
				if (cond(msg)) {
					resolve(true);
				}
			};
		});

		ws = await connectStream(user, channel, callback!, params);
		await trgr();

		return await Promise.race([
			receivedPromise,
			new Promise<void>((r) => setTimeout(() => r(), 3000)).then(() => false),
		]);
	} finally {
		if (ws) ws.close();
	}
};

/**
 * @brief WebSocketストリームから特定条件の通知を拾うプロミスを生成
 * @param user ユーザー認証情報
 * @param channel チャンネル
 * @param cond 条件
 * @param extractor 取り出し処理
 * @param timeout ミリ秒タイムアウト
 * @returns 時間内に正常に処理できた場合に通知からextractorを通した値を得る
 */
export function makeStreamCatcher<T>(
	user: UserToken,
	channel: keyof misskey.Channels,
	cond: (message: Record<string, any>) => boolean,
	extractor: (message: Record<string, any>) => T,
	timeout = 60 * 1000): Promise<T> {
	let ws: WebSocket;
	const p = new Promise<T>(async (resolve) => {
		ws = await connectStream(user, channel, (msg) => {
			if (cond(msg)) {
				resolve(extractor(msg));
			}
		});
	}).finally(() => {
		ws.close();
	});

	return timeoutPromise(p, timeout);
}

export type SimpleGetResponse = {
	status: number,
	body: any | null,
	type: string | null,
	location: string | null
};
export const simpleGet = async (path: string, accept = '*/*', cookie: any = undefined, bodyExtractor: (res: Response) => Promise<string | null> = _ => Promise.resolve(null)): Promise<SimpleGetResponse> => {
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

	if (res.ok && (
		accept.startsWith('application/activity+json') ||
		(accept.startsWith('application/ld+json') && accept.includes('https://www.w3.org/ns/activitystreams'))
	)) {
		// validateContentTypeSetAsActivityPubのテストを兼ねる
		validateContentTypeSetAsActivityPub(res);
	}

	const body =
		jsonTypes.includes(res.headers.get('content-type') ?? '') ? await res.json() :
		htmlTypes.includes(res.headers.get('content-type') ?? '') ? htmlParser.parse(await res.text()) :
		await bodyExtractor(res);

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
		synchronize: !justBorrow,
		dropSchema: !justBorrow,
		entities: initEntities ?? entities,
	});

	await db.initialize();

	return db;
}

export async function sendEnvUpdateRequest(params: { key: string, value?: string }) {
	const res = await fetch(
		`http://localhost:${port + 1000}/env`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		},
	);

	if (res.status !== 200) {
		throw new Error('server env update failed.');
	}
}

export async function sendEnvResetRequest() {
	const res = await fetch(
		`http://localhost:${port + 1000}/env-reset`,
		{
			method: 'POST',
			body: JSON.stringify({}),
		},
	);

	if (res.status !== 200) {
		throw new Error('server env update failed.');
	}
}

// 与えられた値を強制的にエラーとみなす。この関数は型安全性を破壊するため、異常系のアサーション以外で用いられるべきではない。
// FIXME(misskey-js): misskey-jsがエラー情報を公開するようになったらこの関数を廃止する
export function castAsError(obj: Record<string, unknown>): { error: ApiError } {
	return obj as { error: ApiError };
}

export async function captureWebhook<T = SystemWebhookPayload>(postAction: () => Promise<void>, port = WEBHOOK_PORT): Promise<T> {
	const fastify = Fastify();

	let timeoutHandle: NodeJS.Timeout | null = null;
	const result = await new Promise<string>(async (resolve, reject) => {
		fastify.all('/', async (req, res) => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}

			const body = JSON.stringify(req.body);
			res.status(200).send('ok');
			await fastify.close();
			resolve(body);
		});

		await fastify.listen({ port });

		timeoutHandle = setTimeout(async () => {
			await fastify.close();
			reject(new Error('timeout'));
		}, 3000);

		try {
			await postAction();
		} catch (e) {
			await fastify.close();
			reject(e);
		}
	});

	await fastify.close();

	return JSON.parse(result) as T;
}
