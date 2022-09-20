import * as crypto from 'node:crypto';
import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { User } from '@/models/entities/User.js';
import { UserKeypairStoreService } from '@/core/UserKeypairStoreService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

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

@Injectable()
export class ApRequestService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private userKeypairStoreService: UserKeypairStoreService,
		private httpRequestService: HttpRequestService,
	) {
	}

	private createSignedPost(args: { key: PrivateKey, url: string, body: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);
		const digestHeader = `SHA-256=${crypto.createHash('sha256').update(args.body).digest('base64')}`;

		const request: Request = {
			url: u.href,
			method: 'POST',
			headers: this.objectAssignWithLcKey({
				'Date': new Date().toUTCString(),
				'Host': u.hostname,
				'Content-Type': 'application/activity+json',
				'Digest': digestHeader,
			}, args.additionalHeaders),
		};

		const result = this.signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'digest']);

		return {
			request,
			signingString: result.signingString,
			signature: result.signature,
			signatureHeader: result.signatureHeader,
		};
	}

	private createSignedGet(args: { key: PrivateKey, url: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);

		const request: Request = {
			url: u.href,
			method: 'GET',
			headers: this.objectAssignWithLcKey({
				'Accept': 'application/activity+json, application/ld+json',
				'Date': new Date().toUTCString(),
				'Host': new URL(args.url).hostname,
			}, args.additionalHeaders),
		};

		const result = this.signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'accept']);

		return {
			request,
			signingString: result.signingString,
			signature: result.signature,
			signatureHeader: result.signatureHeader,
		};
	}

	private signToRequest(request: Request, key: PrivateKey, includeHeaders: string[]): Signed {
		const signingString = this.genSigningString(request, includeHeaders);
		const signature = crypto.sign('sha256', Buffer.from(signingString), key.privateKeyPem).toString('base64');
		const signatureHeader = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="${includeHeaders.join(' ')}",signature="${signature}"`;

		request.headers = this.objectAssignWithLcKey(request.headers, {
			Signature: signatureHeader,
		});

		return {
			request,
			signingString,
			signature,
			signatureHeader,
		};
	}

	private genSigningString(request: Request, includeHeaders: string[]): string {
		request.headers = this.lcObjectKey(request.headers);

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

	private lcObjectKey(src: Record<string, string>): Record<string, string> {
		const dst: Record<string, string> = {};
		for (const key of Object.keys(src).filter(x => x !== '__proto__' && typeof src[x] === 'string')) dst[key.toLowerCase()] = src[key];
		return dst;
	}

	private objectAssignWithLcKey(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
		return Object.assign(this.lcObjectKey(a), this.lcObjectKey(b));
	}

	public async signedPost(user: { id: User['id'] }, url: string, object: any) {
		const body = JSON.stringify(object);

		const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);

		const req = this.createSignedPost({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${this.config.url}/users/${user.id}#main-key`,
			},
			url,
			body,
			additionalHeaders: {
				'User-Agent': this.config.userAgent,
			},
		});

		await this.httpRequestService.getResponse({
			url,
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
	public async signedGet(url: string, user: { id: User['id'] }) {
		const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);

		const req = this.createSignedGet({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${this.config.url}/users/${user.id}#main-key`,
			},
			url,
			additionalHeaders: {
				'User-Agent': this.config.userAgent,
			},
		});

		const res = await this.httpRequestService.getResponse({
			url,
			method: req.request.method,
			headers: req.request.headers,
		});

		return await res.json();
	}
}
