import CacheableLookup from 'cacheable-lookup';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import { bindThis } from '@/decorators.js';
import * as undici from 'undici';
import { LookupFunction } from 'node:net';
import { TransformStream } from 'node:stream/web';

@Injectable()
export class HttpRequestService {
	/**
	 * Get http non-proxy agent
	 */
	private agent: undici.Agent;

	/**
	 * Get http proxy or non-proxy agent
	 */
	public proxiedAgent: undici.ProxyAgent | undici.Agent;

	public readonly clientDefaults: undici.Agent.Options;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		const cache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});

		this.clientDefaults = {
			keepAliveTimeout: 4 * 1000,
			keepAliveMaxTimeout: 10 * 60 * 1000,
			keepAliveTimeoutThreshold: 1 * 1000,
			strictContentLength: true,
			connect: {
				maxCachedSessions: 100, // TLSセッションのキャッシュ数 https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L80
				lookup: cache.lookup as LookupFunction, // https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L98
			},
		}

		this.agent = new undici.Agent({
			...this.clientDefaults,
		});

		const maxSockets = Math.max(256, config.deliverJobConcurrency ?? 128);

		this.proxiedAgent = config.proxy
			? new undici.ProxyAgent({
				...this.clientDefaults,
				connections: maxSockets,

				uri: config.proxy,
			})
			: this.agent;
	}

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getAgentByUrl(url: URL, bypassProxy = false): undici.Agent | undici.ProxyAgent {
		if (bypassProxy || (this.config.proxyBypassHosts || []).includes(url.hostname)) {
			return this.agent;
		} else {
			return this.proxiedAgent;
		}
	}

	@bindThis
	public async getJson(url: string, accept = 'application/json, */*', timeout = 10000, headers?: Record<string, string>): Promise<unknown> {
		const res = await this.getResponse({
			url,
			method: 'GET',
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers ?? {}),
			timeout,
			size: 1024 * 256,
		});

		return await res.json();
	}

	@bindThis
	public async getHtml(url: string, accept = 'text/html, */*', timeout = 10000, headers?: Record<string, string>): Promise<string> {
		const res = await this.getResponse({
			url,
			method: 'GET',
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers ?? {}),
			timeout,
		});

		return await res.text();
	}

	@bindThis
	public async getResponse(args: {
		url: string,
		method: string,
		body?: string,
		headers: Record<string, string>,
		timeout?: number,
		size?: number,
		redirect?: RequestRedirect | undefined,
		dispatcher?: undici.Dispatcher,
	}): Promise<undici.Response> {
		const timeout = args.timeout ?? 10 * 1000;

		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeout * 6);

		const res = await Promise.race([
			undici.fetch(args.url, {
				method: args.method,
				headers: args.headers,
				body: args.body,
				redirect: args.redirect,
				dispatcher: args.dispatcher ?? this.getAgentByUrl(new URL(args.url)),
				keepalive: true,
				signal: controller.signal,
			}),
			new Promise<null>((res) => setTimeout(() => res(null)))
		]);

		if (res == null) {
			throw new StatusError(`Request Timeout`, 408, 'Request Timeout');
		}

		if (!res.ok) {
			throw new StatusError(`${res.status} ${res.statusText}`, res.status, res.statusText);
		}

		return ({
			...res,
			body: this.fetchLimiter(res, args.size),
		});
	}

	/**
	 * Fetch body limiter
	 * @param res undici.Response
	 * @param size number of Max size (Bytes) (default: 10MiB)
	 * @returns ReadableStream<Uint8Array> (provided by node:stream/web)
	 */
	@bindThis
	private fetchLimiter(res: undici.Response, size: number = 10 * 1024 * 1024) {
		if (res.body == null) return null;

		let total = 0;
		return res.body.pipeThrough(new TransformStream({
			start() {},
			transform(chunk, controller) {
				// TypeScirptグローバルの定義はUnit8ArrayだがundiciはReadableStream<any>を渡してくるので一応変換
				const uint8 = new Uint8Array(chunk);
				total += uint8.length;
				if (total > size) {
					controller.error(new StatusError(`Payload Too Large`, 413, 'Payload Too Large'));
				} else {
					controller.enqueue(uint8);
				}
			},
			flush() {},
		}));
	}
}
