/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Window } from 'happy-dom';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiUser } from '@/models/User.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import { validateContentTypeSetAsActivityPub } from '@/core/activitypub/misc/validator.js';
import { assertActivityMatchesUrls } from '@/core/activitypub/misc/check-against-url.js';
import type { IObject } from './type.js';

type Request = {
	url: string;
	method: string;
	headers: Record<string, string>;
};

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

export class ApRequestCreator {
	static createSignedPost(args: { key: PrivateKey, url: string, body: string, digest?: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);
		const digestHeader = args.digest ?? this.createDigest(args.body);

		const request: Request = {
			url: u.href,
			method: 'POST',
			headers: this.#objectAssignWithLcKey({
				'Date': new Date().toUTCString(),
				'Host': u.host,
				'Content-Type': 'application/activity+json',
				'Digest': digestHeader,
			}, args.additionalHeaders),
		};

		const result = this.#signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'digest']);

		return {
			request,
			signingString: result.signingString,
			signature: result.signature,
			signatureHeader: result.signatureHeader,
		};
	}

	static createDigest(body: string) {
		return `SHA-256=${crypto.createHash('sha256').update(body).digest('base64')}`;
	}

	static createSignedGet(args: { key: PrivateKey, url: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);

		const request: Request = {
			url: u.href,
			method: 'GET',
			headers: this.#objectAssignWithLcKey({
				'Accept': 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
				'Date': new Date().toUTCString(),
				'Host': new URL(args.url).host,
			}, args.additionalHeaders),
		};

		const result = this.#signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'accept']);

		return {
			request,
			signingString: result.signingString,
			signature: result.signature,
			signatureHeader: result.signatureHeader,
		};
	}

	static #signToRequest(request: Request, key: PrivateKey, includeHeaders: string[]): Signed {
		const signingString = this.#genSigningString(request, includeHeaders);
		const signature = crypto.sign('sha256', Buffer.from(signingString), key.privateKeyPem).toString('base64');
		const signatureHeader = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="${includeHeaders.join(' ')}",signature="${signature}"`;

		request.headers = this.#objectAssignWithLcKey(request.headers, {
			Signature: signatureHeader,
		});
		// node-fetch will generate this for us. if we keep 'Host', it won't change with redirects!
		delete request.headers['host'];

		return {
			request,
			signingString,
			signature,
			signatureHeader,
		};
	}

	static #genSigningString(request: Request, includeHeaders: string[]): string {
		request.headers = this.#lcObjectKey(request.headers);

		const results: string[] = [];

		for (const key of includeHeaders.map(x => x.toLowerCase())) {
			if (key === '(request-target)') {
				results.push(`(request-target): ${request.method.toLowerCase()} ${new URL(request.url).pathname}`);
			} else {
				results.push(`${key}: ${request.headers[key]}`);
			}
		}

		return results.join('\n');
	}

	static #lcObjectKey(src: Record<string, string>): Record<string, string> {
		const dst: Record<string, string> = {};
		for (const key of Object.keys(src).filter(x => x !== '__proto__' && typeof src[x] === 'string')) dst[key.toLowerCase()] = src[key];
		return dst;
	}

	static #objectAssignWithLcKey(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
		return Object.assign(this.#lcObjectKey(a), this.#lcObjectKey(b));
	}
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
		private utilityService: UtilityService,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		this.logger = this.loggerService?.getLogger('ap-request'); // なぜか TypeError: Cannot read properties of undefined (reading 'getLogger') と言われる
	}

	@bindThis
	public async signedPost(user: { id: MiUser['id'] }, url: string, object: unknown, digest?: string): Promise<void> {
		const body = typeof object === 'string' ? object : JSON.stringify(object);

		const keypair = await this.userKeypairService.getUserKeypair(user.id);

		const req = ApRequestCreator.createSignedPost({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${this.config.url}/users/${user.id}#main-key`,
			},
			url,
			body,
			digest,
			additionalHeaders: {
			},
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
	public async signedGet(url: string, user: { id: MiUser['id'] }, followAlternate?: boolean): Promise<unknown> {
		const _followAlternate = followAlternate ?? true;
		const keypair = await this.userKeypairService.getUserKeypair(user.id);

		const req = ApRequestCreator.createSignedGet({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${this.config.url}/users/${user.id}#main-key`,
			},
			url,
			additionalHeaders: {
			},
		});

		const res = await this.httpRequestService.send(url, {
			method: req.request.method,
			headers: req.request.headers,
		}, {
			throwErrorWhenResponseNotOk: true,
		});

		//#region リクエスト先がhtmlかつactivity+jsonへのalternate linkタグがあるとき
		const contentType = res.headers.get('content-type');

		if (
			res.ok &&
			(contentType ?? '').split(';')[0].trimEnd().toLowerCase() === 'text/html' &&
			_followAlternate === true
		) {
			const html = await res.text();
			const { window, happyDOM } = new Window({
				settings: {
					disableJavaScriptEvaluation: true,
					disableJavaScriptFileLoading: true,
					disableCSSFileLoading: true,
					disableComputedStyleRendering: true,
					handleDisabledFileLoadingAsSuccess: true,
					navigation: {
						disableMainFrameNavigation: true,
						disableChildFrameNavigation: true,
						disableChildPageNavigation: true,
						disableFallbackToSetURL: true,
					},
					timer: {
						maxTimeout: 0,
						maxIntervalTime: 0,
						maxIntervalIterations: 0,
					},
				},
			});
			const document = window.document;
			try {
				document.documentElement.innerHTML = html;

				const alternate = document.querySelector('head > link[rel="alternate"][type="application/activity+json"]');
				if (alternate) {
					const href = alternate.getAttribute('href');
					if (href && this.utilityService.punyHost(url) === this.utilityService.punyHost(href)) {
						return await this.signedGet(href, user, false);
					}
				}
			} catch (e) {
				// something went wrong parsing the HTML, ignore the whole thing
			} finally {
				happyDOM.close().catch(err => {});
			}
		}
		//#endregion

		validateContentTypeSetAsActivityPub(res);
		const finalUrl = res.url; // redirects may have been involved
		const activity = await res.json() as IObject;

		assertActivityMatchesUrls(activity, [finalUrl]);

		return activity;
	}
}
