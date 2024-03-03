/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { genRFC3230DigestHeader, RequestLike, signAsDraftToRequest } from '@misskey-dev/node-http-message-signatures';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiUser } from '@/models/User.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import { validateContentTypeSetAsActivityPub } from '@/core/activitypub/misc/validator.js';

type Signed = {
	request: Request;
	signingString: string;
	signature: string;
	signatureHeader: string;
};

type PrivateKey = {
	privateKeyPem: string;
	keyId: string;
};

export async function createSignedPost(args: { level: string; key: PrivateKey; url: string; body: string; additionalHeaders: Record<string, string> }) {
	const u = new URL(args.url);
	const request: RequestLike = {
		url: u.href,
		method: 'POST',
		headers: {
			'Date': new Date().toUTCString(),
			'Host': u.host,
			'Content-Type': 'application/activity+json',
			...args.additionalHeaders,
		},
	};

	// TODO: levelによって処理を分ける
	const digestHeader = await genRFC3230DigestHeader(args.body, 'SHA-256');
	request.headers['Digest'] = digestHeader;

	const result = await signAsDraftToRequest(request, args.key, ['(request-target)', 'date', 'host', 'digest']);

	return {
		request,
		...result,
	};
}

export async function createSignedGet(args: { level: string; key: PrivateKey; url: string; additionalHeaders: Record<string, string> }) {
	const u = new URL(args.url);
	const request: RequestLike = {
		url: u.href,
		method: 'GET',
		headers: {
			'Accept': 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
			'Date': new Date().toUTCString(),
			'Host': new URL(args.url).host,
			...args.additionalHeaders,
		},
	};

	// TODO: levelによって処理を分ける
	const result = await signAsDraftToRequest(request, args.key, ['(request-target)', 'date', 'host', 'accept']);

	return {
		request,
		...result,
	};
}

@Injectable()
export class ApRequestService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private userKeypairService: UserKeypairService,
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		this.logger = this.loggerService?.getLogger('ap-request'); // なぜか TypeError: Cannot read properties of undefined (reading 'getLogger') と言われる
	}

	@bindThis
	private async getPrivateKey(userId: MiUser['id'], level: string): Promise<PrivateKey> {
		const keypair = await this.userKeypairService.getUserKeypair(userId);

		return (level !== '00' && keypair.ed25519PrivateKey) ? {
			privateKeyPem: keypair.ed25519PrivateKey,
			keyId: `${this.config.url}/users/${userId}#ed25519-key`,
		} : {
			privateKeyPem: keypair.privateKey,
			keyId: `${this.config.url}/users/${userId}#main-key`,
		};
	}

	@bindThis
	public async signedPost(user: { id: MiUser['id'] }, url: string, object: unknown, level: string): Promise<void> {
		const body = typeof object === 'string' ? object : JSON.stringify(object);
		const key = await this.getPrivateKey(user.id, level);
		const req = await createSignedPost({
			level,
			key,
			url,
			body,
			additionalHeaders: {
				'User-Agent': this.config.userAgent,
			},
		});

		this.logger.debug('create signed post', {
			version: 'draft',
			level,
			url,
			keyId: key.keyId,
		});

		await this.httpRequestService.send(url, {
			method: req.request.method,
			headers: req.request.headers,
			body,
		});
	}

	/**
	 * Get AP object with http-signature
	 * @param user http-signature user
	 * @param url URL to fetch
	 */
	@bindThis
	public async signedGet(url: string, user: { id: MiUser['id'] }, level: string): Promise<unknown> {
		const key = await this.getPrivateKey(user.id, level);
		const req = await createSignedGet({
			level,
			key,
			url,
			additionalHeaders: {
				'User-Agent': this.config.userAgent,
			},
		});

		this.logger.debug('create signed get', {
			version: 'draft',
			level,
			url,
			keyId: key.keyId,
		});

		const res = await this.httpRequestService.send(url, {
			method: req.request.method,
			headers: req.request.headers,
		}, {
			throwErrorWhenResponseNotOk: true,
			validators: [validateContentTypeSetAsActivityPub],
		});

		return await res.json();
	}
}
