import * as http from 'node:http';
import * as https from 'node:https';
import CacheableLookup from 'cacheable-lookup';
import fetch from 'node-fetch';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types';
import type { URL } from 'node:url';

@Injectable()
export class HttpRequestService {
	/**
	 * Get http non-proxy agent
	 */
	#_http: http.Agent;

	/**
	 * Get https non-proxy agent
	 */
	#_https: https.Agent;

	/**
	 * Get http proxy or non-proxy agent
	 */
	public httpAgent: http.Agent;

	/**
	 * Get https proxy or non-proxy agent
	 */
	public httpsAgent: https.Agent;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,
	) {
		const cache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});
		
		this.#_http = new http.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: cache.lookup,
		} as http.AgentOptions);
		
		this.#_https = new https.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: cache.lookup,
		} as https.AgentOptions);
		
		const maxSockets = Math.max(256, config.deliverJobConcurrency || 128);
		
		this.httpAgent = config.proxy
			? new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.#_http;

		this.httpsAgent = config.proxy
			? new HttpsProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.#_https;
	}

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	public getAgentByUrl(url: URL, bypassProxy = false): http.Agent | https.Agent {
		if (bypassProxy || (this.config.proxyBypassHosts || []).includes(url.hostname)) {
			return url.protocol === 'http:' ? this.#_http : this.#_https;
		} else {
			return url.protocol === 'http:' ? this.httpAgent : this.httpsAgent;
		}
	}

	public async getJson(url: string, accept = 'application/json, */*', timeout = 10000, headers?: Record<string, string>) {
		const res = await this.getResponse({
			url,
			method: 'GET',
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers || {}),
			timeout,
		});

		return await res.json();
	}

	public async getHtml(url: string, accept = 'text/html, */*', timeout = 10000, headers?: Record<string, string>) {
		const res = await this.getResponse({
			url,
			method: 'GET',
			headers: Object.assign({
				'User-Agent': this.config.userAgent,
				Accept: accept,
			}, headers || {}),
			timeout,
		});

		return await res.text();
	}

	public async getResponse(args: { url: string, method: string, body?: string, headers: Record<string, string>, timeout?: number, size?: number }) {
		const timeout = args.timeout || 10 * 1000;

		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeout * 6);

		const res = await fetch(args.url, {
			method: args.method,
			headers: args.headers,
			body: args.body,
			timeout,
			size: args.size || 10 * 1024 * 1024,
			agent: this.getAgentByUrl,
			signal: controller.signal,
		});

		if (!res.ok) {
			throw new StatusError(`${res.status} ${res.statusText}`, res.status, res.statusText);
		}

		return res;
	}
}

export class StatusError extends Error {
	public statusCode: number;
	public statusMessage?: string;
	public isClientError: boolean;

	constructor(message: string, statusCode: number, statusMessage?: string) {
		super(message);
		this.name = 'StatusError';
		this.statusCode = statusCode;
		this.statusMessage = statusMessage;
		this.isClientError = typeof this.statusCode === 'number' && this.statusCode >= 400 && this.statusCode < 500;
	}
}
