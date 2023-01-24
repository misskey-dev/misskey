import * as crypto from 'node:crypto';
import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { User } from '@/models/entities/User.js';
import { UserKeypairStoreService } from '@/core/UserKeypairStoreService.js';
import { HttpRequestService, UndiciFetcher } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import type { Dispatcher } from 'undici';
import { DevNull } from '@/misc/dev-null.js';

type Request = {
	url: string;
	method: Dispatcher.HttpMethod;
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
	private undiciFetcher: UndiciFetcher;
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private userKeypairStoreService: UserKeypairStoreService,
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('ap-request'); // なぜか TypeError: Cannot read properties of undefined (reading 'getLogger') と言われる
		this.undiciFetcher = this.httpRequestService.createFetcher({
			maxRedirections: 0,
		}, {}, this.logger);
	}

	@bindThis
	private createSignedPost(args: { key: PrivateKey, url: string, body: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);
		const digestHeader = `SHA-256=${crypto.createHash('sha256').update(args.body).digest('base64')}`;

		const request: Request = {
			url: u.href,
			method: 'POST',
			headers: this.objectAssignWithLcKey({
				'Date': new Date().toUTCString(),
				'Host': u.host,
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

	@bindThis
	private createSignedGet(args: { key: PrivateKey, url: string, additionalHeaders: Record<string, string> }): Signed {
		const u = new URL(args.url);

		const request: Request = {
			url: u.href,
			method: 'GET',
			headers: this.objectAssignWithLcKey({
				'Accept': 'application/activity+json, application/ld+json',
				'Date': new Date().toUTCString(),
				'Host': new URL(args.url).host,
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

	@bindThis
	private signToRequest(request: Request, key: PrivateKey, includeHeaders: string[]): Signed {
		const signingString = this.genSigningString(request, includeHeaders);
		const signature = crypto.sign('sha256', Buffer.from(signingString), key.privateKeyPem).toString('base64');
		const signatureHeader = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="${includeHeaders.join(' ')}",signature="${signature}"`;

		request.headers = this.objectAssignWithLcKey(request.headers, {
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

	@bindThis
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

	@bindThis
	private lcObjectKey(src: Record<string, string>): Record<string, string> {
		const dst: Record<string, string> = {};
		for (const key of Object.keys(src).filter(x => x !== '__proto__' && typeof src[x] === 'string')) dst[key.toLowerCase()] = src[key];
		return dst;
	}

	@bindThis
	private objectAssignWithLcKey(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
		return Object.assign(this.lcObjectKey(a), this.lcObjectKey(b));
	}

	@bindThis
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
			},
		});

		const response = await this.undiciFetcher.request(
			url,
			{
				method: req.request.method,
				headers: req.request.headers,
				body,
			},
		);
		response.body.pipe(new DevNull());
	}

	/**
	 * Get AP object with http-signature
	 * @param user http-signature user
	 * @param url URL to fetch
	 */
	@bindThis
	public async signedGet(url: string, user: { id: User['id'] }) {
		const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);

		const req = this.createSignedGet({
			key: {
				privateKeyPem: keypair.privateKey,
				keyId: `${this.config.url}/users/${user.id}#main-key`,
			},
			url,
			additionalHeaders: {
			},
		});

		const res = await this.httpRequestService.fetch(
			url,
			{
				method: req.request.method,
				headers: req.request.headers,
			},
		);

		return await res.json();
	}
}
