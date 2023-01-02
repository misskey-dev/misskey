import * as http from 'node:http';
import * as https from 'node:https';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import { bindThis } from '@/decorators.js';
import * as undici from 'undici';
import { LookupFunction } from 'node:net';
import { TransformStream } from 'node:stream/web';
import * as dns from 'node:dns';

export type IpChecker = (ip: string) => boolean;

@Injectable()
export class HttpRequestService {
	/**
	 * Get http non-proxy agent (undici)
	 */
	private nonProxiedAgent: undici.Agent;

	/**
	 * Get http proxy or non-proxy agent (undici)
	 */
	public agent: undici.ProxyAgent | undici.Agent;

	//#region for old http/https, only used in S3Service
	// http non-proxy agent
	private http: http.Agent;

	// https non-proxy agent
	private https: https.Agent;

	// http proxy or non-proxy agent
	public httpAgent: http.Agent;

	// https proxy or non-proxy agent
	public httpsAgent: https.Agent;
	//#endregion

	public readonly dnsCache: CacheableLookup;
	public readonly clientDefaults: undici.Agent.Options;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.dnsCache = new CacheableLookup({
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
				lookup: this.dnsCache.lookup as LookupFunction, // https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L98
			},
		}

		this.nonProxiedAgent = new undici.Agent({
			...this.clientDefaults,
		});

		this.http = new http.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: this.dnsCache.lookup,
		} as http.AgentOptions);
		
		this.https = new https.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: this.dnsCache.lookup,
		} as https.AgentOptions);

		const maxSockets = Math.max(256, config.deliverJobConcurrency ?? 128);

		this.agent = config.proxy
			? new undici.ProxyAgent({
				...this.clientDefaults,
				connections: maxSockets,

				uri: config.proxy,
			})
			: this.nonProxiedAgent;

	//#region for old http/https, only used in S3Service
		this.httpAgent = config.proxy
			? new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.http;

		this.httpsAgent = config.proxy
			? new HttpsProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.https;
	}
	//#endregion

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getAgentByUrl(url: URL, bypassProxy = false): undici.Agent | undici.ProxyAgent {
		if (bypassProxy || (this.config.proxyBypassHosts || []).includes(url.hostname)) {
			return this.nonProxiedAgent;
		} else {
			return this.agent;
		}
	}

	/**
	 * Get http agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getHttpAgentByUrl(url: URL, bypassProxy = false): http.Agent | https.Agent {
		if (bypassProxy || (this.config.proxyBypassHosts || []).includes(url.hostname)) {
			return url.protocol === 'http:' ? this.http : this.https;
		} else {
			return url.protocol === 'http:' ? this.httpAgent : this.httpsAgent;
		}
	}
	/**
	 * check ip
	 */
	@bindThis
	public checkIp(url: URL, fn: IpChecker): Promise<boolean> {
		const lookup = this.dnsCache.lookup as LookupFunction || dns.lookup;

		return new Promise((resolve, reject) => {
			lookup(url.hostname, {}, (err, ip) => {
				if (err) {
					resolve(false);
				} else {
					resolve(fn(ip));
				}
			});
		});
	}

	@bindThis
	public async getJson<T extends unknown>(url: string, accept = 'application/json, */*', timeout = 10000, headers?: Record<string, string>): Promise<T> {
		const res = await this.fetch({
			url,
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers ?? {}),
			timeout,
			size: 1024 * 256,
		});

		return await res.json() as T;
	}

	@bindThis
	public async getHtml(url: string, accept = 'text/html, */*', timeout = 10000, headers?: Record<string, string>): Promise<string> {
		const res = await this.fetch({
			url,
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers ?? {}),
			timeout,
		});

		return await res.text();
	}

	@bindThis
	public async fetch(args: {
		url: string,
		method?: string,
		body?: string,
		headers?: Record<string, string>,
		timeout?: number,
		size?: number,
		redirect?: RequestRedirect | undefined,
		dispatcher?: undici.Dispatcher,
		ipCheckers?: {
			type: 'black' | 'white',
			fn: IpChecker,
		}[],
		noOkError?: boolean,
	}): Promise<undici.Response> {
		const url = new URL(args.url);

		if (args.ipCheckers) {
			for (const check of args.ipCheckers) {
				const result = await this.checkIp(url, check.fn);
				if (
					(check.type === 'black' && result === true) ||
					(check.type === 'white' && result === false)
				) {
					throw new StatusError('IP is not allowed', 403, 'IP is not allowed');
				}
			}
		}

		const timeout = args.timeout ?? 10 * 1000;

		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeout * 6);

		const res = await Promise.race([
			undici.fetch(args.url, {
				method: args.method ?? 'GET',
				headers: args.headers,
				body: args.body,
				redirect: args.redirect,
				dispatcher: args.dispatcher ?? this.getAgentByUrl(url),
				keepalive: true,
				signal: controller.signal,
			}),
			new Promise<null>((res) => setTimeout(() => res(null), timeout))
		]);

		if (res == null) {
			throw new StatusError(`Request Timeout`, 408, 'Request Timeout');
		}

		if (!res.ok && !args.noOkError) {
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
