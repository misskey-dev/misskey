/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import * as htmlParser from 'node-html-parser';
import type { Config } from '@/config.js';
import { assertActivityMatchesUrl, FetchAllowSoftFailMask } from '@/core/activitypub/misc/check-against-url.js';
import { validateContentTypeSetAsActivityPub } from '@/core/activitypub/misc/validator.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { UserKeypairService } from '@/core/UserKeypairService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
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

// biome-ignore lint/complexity/noStaticOnlyClass: allow for this case
export class ApRequestCreator {
	static createSignedPost(args: { key: PrivateKey, url: string, body: string, digest?: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);
		const digestHeader = args.digest ?? ApRequestCreator.createDigest(args.body);

		const request: Request = {
			url: u.href,
			method: 'POST',
			headers: ApRequestCreator.#objectAssignWithLcKey({
				'Date': new Date().toUTCString(),
				'Host': u.host,
				'Content-Type': 'application/activity+json',
				'Digest': digestHeader,
			}, args.additionalHeaders),
		};

		const result = ApRequestCreator.#signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'digest']);

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
			headers: ApRequestCreator.#objectAssignWithLcKey({
				'Accept': 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
				'Date': new Date().toUTCString(),
				'Host': new URL(args.url).host,
			}, args.additionalHeaders),
		};

		const result = ApRequestCreator.#signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'accept']);

		return {
			request,
			signingString: result.signingString,
			signature: result.signature,
			signatureHeader: result.signatureHeader,
		};
	}

	static #signToRequest(request: Request, key: PrivateKey, includeHeaders: string[]): Signed {
		const signingString = ApRequestCreator.#genSigningString(request, includeHeaders);
		const signature = crypto.sign('sha256', Buffer.from(signingString), key.privateKeyPem).toString('base64');
		const signatureHeader = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="${includeHeaders.join(' ')}",signature="${signature}"`;

		request.headers = ApRequestCreator.#objectAssignWithLcKey(request.headers, {
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
		request.headers = ApRequestCreator.#lcObjectKey(request.headers);

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
		return Object.assign(ApRequestCreator.#lcObjectKey(a), ApRequestCreator.#lcObjectKey(b));
	}
}

@Injectable()
export class ApRequestService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private userKeypairService: UserKeypairService,
		private httpRequestService: HttpRequestService,
		private utilityService: UtilityService,
	) {
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
	public async signedGet(url: string, user: { id: MiUser['id'] }, allowSoftfail: FetchAllowSoftFailMask = FetchAllowSoftFailMask.Strict, followAlternate?: boolean): Promise<unknown> {
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

			try {
				const document = htmlParser.parse(html);

				const alternate = document.querySelector('head > link[rel="alternate"][type="application/activity+json"]');
				if (alternate) {
					const href = alternate.getAttribute('href');
					if (href && this.utilityService.punyHost(url) === this.utilityService.punyHost(href)) {
						return await this.signedGet(href, user, allowSoftfail, false);
					}
				}
			} catch (_) {
				// something went wrong parsing the HTML, ignore the whole thing
			}
		}
		//#endregion

		validateContentTypeSetAsActivityPub(res);
		const finalUrl = res.url; // redirects may have been involved
		const activity = await res.json() as IObject;

		assertActivityMatchesUrl(url, activity, finalUrl, allowSoftfail);

		return activity;
	}
}
