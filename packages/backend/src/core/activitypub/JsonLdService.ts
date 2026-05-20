/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { CONTEXT, PRELOADED_CONTEXTS } from './misc/contexts.js';
import { validateContentTypeSetAsJsonLD } from './misc/validator.js';
import type { JsonLdDocument } from 'jsonld';
import type { JsonLd as JsonLdObject, RemoteDocument } from 'jsonld/jsonld-spec.js';

// RsaSignature2017 implementation is based on https://github.com/transmute-industries/RsaSignature2017

export class JsonLdError extends IdentifiableError {
	constructor(id: string, message?: string) {
		super(id, message);
	}
}

export class JsonLdCacheOverflowError extends JsonLdError {
	constructor() {
		super('42fb039c-69fb-4f75-8187-d3aee412423e', 'context cache overflow');
	}
}

export class JsonLdCacheFrozenError extends JsonLdError {
	constructor() {
		super('202c41fa-72d5-4e22-95af-94a8ac83346f', 'attempt to insert into frozen context cache');
	}
}

export class JsonLdForbiddenDriectiveError extends JsonLdError {
	constructor(public directive: string) {
		super('0297f79b-0ed9-4b6c-875f-b0a82ff96781', `${directive} is forbidden by Misskey in ActivityPub documents`);
	}
}

export class JsonLd {
	private static forbiddenDirectives = new Set([
		'@included',
		'@graph',
		'@reverse',
	]);

	private frozen = false;
	private cache: Map<string, RemoteDocument> = new Map();

	public debug = false;
	public preLoad = true;
	public loderTimeout = 5000;

	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public async signRsaSignature2017(data: any, privateKey: string, creator: string, domain?: string, created?: Date): Promise<any> {
		const options: {
			type: string;
			creator: string;
			domain?: string;
			nonce: string;
			created: string;
		} = {
			type: 'RsaSignature2017',
			creator,
			nonce: crypto.randomBytes(16).toString('hex'),
			created: (created ?? new Date()).toISOString(),
		};

		if (domain) {
			options.domain = domain;
		}

		const toBeSigned = await this.createVerifyData(data, options);

		const signer = crypto.createSign('sha256');
		signer.update(toBeSigned);
		signer.end();

		const signature = signer.sign(privateKey);

		return {
			...data,
			signature: {
				...options,
				signatureValue: signature.toString('base64'),
			},
		};
	}

	@bindThis
	public async verifyRsaSignature2017(data: any, publicKey: string): Promise<boolean> {
		const toBeSigned = await this.createVerifyData(data, data.signature);
		const verifier = crypto.createVerify('sha256');
		verifier.update(toBeSigned);
		return verifier.verify(publicKey, data.signature.signatureValue, 'base64');
	}

	@bindThis
	public async createVerifyData(data: any, options: any): Promise<string> {
		const transformedOptions = {
			...options,
			'@context': 'https://w3id.org/identity/v1',
		};
		delete transformedOptions['type'];
		delete transformedOptions['id'];
		delete transformedOptions['signatureValue'];
		const canonizedOptions = await this.normalize(transformedOptions);
		const optionsHash = this.sha256(canonizedOptions.toString());
		const transformedData = { ...data };
		delete transformedData['signature'];
		const cannonizedData = await this.normalize(transformedData);
		if (this.debug) console.debug(`cannonizedData: ${cannonizedData}`);
		const documentHash = this.sha256(cannonizedData.toString());
		const verifyData = `${optionsHash}${documentHash}`;
		return verifyData;
	}

	@bindThis
	public async compact(data: any, context: any = CONTEXT): Promise<JsonLdDocument> {
		const customLoader = this.getLoader();
		// XXX: Importing jsonld dynamically since Jest frequently fails to import it statically
		// https://github.com/misskey-dev/misskey/pull/9894#discussion_r1103753595
		return (await import('jsonld')).default.compact(data, context, {
			documentLoader: customLoader,
		});
	}

	@bindThis
	public async normalize(data: JsonLdDocument): Promise<string> {
		const customLoader = this.getLoader();
		return (await import('jsonld')).default.normalize(data, {
			documentLoader: customLoader,
		});
	}

	/**
	 * Prevent any further HTTP requests from being made for the sake of
	 * validating JSON-LD signatures.
	 */
	@bindThis
	public freeze(): void { this.frozen = true; }

	@bindThis
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public checkForForbiddenDirectives(value: any): void {
		if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				for (const item of value) this.checkForForbiddenDirectives(item);
			} else {
				const object = value;
				for (const [key, value] of Object.entries(object)) {
					if (JsonLd.forbiddenDirectives.has(key)) {
						throw new JsonLdForbiddenDriectiveError(key);
					}

					if (typeof value === 'object' && value !== null) {
						this.checkForForbiddenDirectives(value);
					}
				}
			}
		}
	}

	@bindThis
	private getLoader() {
		return async (url: string): Promise<RemoteDocument> => {
			if (!/^https?:\/\//.test(url)) throw new Error(`Invalid URL ${url}`);

			if (this.preLoad) {
				if (url in PRELOADED_CONTEXTS) {
					if (this.debug) console.debug(`HIT: ${url}`);
					return {
						contextUrl: undefined,
						document: PRELOADED_CONTEXTS[url],
						documentUrl: url,
					};
				}
			}

			const cached = this.cache.get(url);
			if (cached) {
				if (this.debug) console.debug(`HIT: ${url}`);
				return cached;
			}

			if (this.debug) console.debug(`MISS: ${url}`);

			if (this.frozen) throw new JsonLdCacheFrozenError();

			const document = await this.fetchDocument(url);
			this.checkForForbiddenDirectives(document);

			const remoteDocument = {
				contextUrl: undefined,
				document: document,
				documentUrl: url,
			};
			this.cache.set(url, remoteDocument);
			if (this.cache.size > 256) throw new JsonLdCacheOverflowError();
			return remoteDocument;
		};
	}

	@bindThis
	private async fetchDocument(url: string): Promise<JsonLdObject> {
		const json = await this.httpRequestService.send(
			url,
			{
				headers: {
					Accept: 'application/ld+json, application/json',
				},
				timeout: this.loderTimeout,
			},
			{
				throwErrorWhenResponseNotOk: false,
				validators: [validateContentTypeSetAsJsonLD],
			},
		).then(res => {
			if (!res.ok) {
				throw new Error(`${res.status} ${res.statusText}`);
			} else {
				return res.json();
			}
		});

		return json as JsonLdObject;
	}

	@bindThis
	public sha256(data: string): string {
		const hash = crypto.createHash('sha256');
		hash.update(data);
		return hash.digest('hex');
	}
}

@Injectable()
export class JsonLdService {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public use(): JsonLd {
		return new JsonLd(this.httpRequestService);
	}
}
