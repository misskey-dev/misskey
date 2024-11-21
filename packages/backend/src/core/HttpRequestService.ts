/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import ipaddr from 'ipaddr.js';
import CacheableLookup from 'cacheable-lookup';
import fetch from 'node-fetch';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import { bindThis } from '@/decorators.js';
import { validateContentTypeSetAsActivityPub } from '@/core/activitypub/misc/validator.js';
import { assertActivityMatchesUrls } from '@/core/activitypub/misc/check-against-url.js';
import type { IObject } from '@/core/activitypub/type.js';
import type { Response } from 'node-fetch';
import type { URL } from 'node:url';

export type HttpRequestSendOptions = {
	throwErrorWhenResponseNotOk: boolean;
	validators?: ((res: Response) => void)[];
};

declare module 'node:http' {
	interface Agent {
		createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
	}
}

class HttpRequestServiceAgent extends http.Agent {
	constructor(
		private config: Config,
		options?: http.AgentOptions,
	) {
		super(options);
	}

	@bindThis
	public createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket {
		const socket = super.createConnection(options, callback)
			.on('connect', () => {
				const address = socket.remoteAddress;
				if (process.env.NODE_ENV === 'production') {
					if (address && ipaddr.isValid(address)) {
						if (this.isPrivateIp(address)) {
							socket.destroy(new Error(`Blocked address: ${address}`));
						}
					}
				}
			});
		return socket;
	}

	@bindThis
	private isPrivateIp(ip: string): boolean {
		const parsedIp = ipaddr.parse(ip);

		for (const net of this.config.allowedPrivateNetworks ?? []) {
			const cidr = ipaddr.parseCIDR(net);
			if (cidr[0].kind() === parsedIp.kind() && parsedIp.match(ipaddr.parseCIDR(net))) {
				return false;
			}
		}

		return parsedIp.range() !== 'unicast';
	}
}

class HttpsRequestServiceAgent extends https.Agent {
	constructor(
		private config: Config,
		options?: https.AgentOptions,
	) {
		super(options);
	}

	@bindThis
	public createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket {
		const socket = super.createConnection(options, callback)
			.on('connect', () => {
				const address = socket.remoteAddress;
				if (process.env.NODE_ENV === 'production') {
					if (address && ipaddr.isValid(address)) {
						if (this.isPrivateIp(address)) {
							socket.destroy(new Error(`Blocked address: ${address}`));
						}
					}
				}
			});
		return socket;
	}

	@bindThis
	private isPrivateIp(ip: string): boolean {
		const parsedIp = ipaddr.parse(ip);

		for (const net of this.config.allowedPrivateNetworks ?? []) {
			const cidr = ipaddr.parseCIDR(net);
			if (cidr[0].kind() === parsedIp.kind() && parsedIp.match(ipaddr.parseCIDR(net))) {
				return false;
			}
		}

		return parsedIp.range() !== 'unicast';
	}
}

@Injectable()
export class HttpRequestService {
	/**
	 * Get http non-proxy agent (without local address filtering)
	 */
	private httpNative: http.Agent;

	/**
	 * Get https non-proxy agent (without local address filtering)
	 */
	private httpsNative: https.Agent;

	/**
	 * Get http non-proxy agent
	 */
	private http: http.Agent;

	/**
	 * Get https non-proxy agent
	 */
	private https: https.Agent;

	/**
	 * Get http proxy or non-proxy agent
	 */
	public httpAgent: http.Agent;

	/**
	 * Get https proxy or non-proxy agent
	 */
	public httpsAgent: https.Agent;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		const cache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});

		const agentOption = {
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: cache.lookup as unknown as net.LookupFunction,
			localAddress: config.outgoingAddress,
		};

		this.httpNative = new http.Agent(agentOption);

		this.httpsNative = new https.Agent(agentOption);

		this.http = new HttpRequestServiceAgent(config, agentOption);

		this.https = new HttpsRequestServiceAgent(config, agentOption);

		const maxSockets = Math.max(256, config.deliverJobConcurrency ?? 128);

		this.httpAgent = config.proxy
			? new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
				localAddress: config.outgoingAddress,
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
				localAddress: config.outgoingAddress,
			})
			: this.https;
	}

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getAgentByUrl(url: URL, bypassProxy = false, isLocalAddressAllowed = false): http.Agent | https.Agent {
		if (bypassProxy || (this.config.proxyBypassHosts ?? []).includes(url.hostname)) {
			if (isLocalAddressAllowed) {
				return url.protocol === 'http:' ? this.httpNative : this.httpsNative;
			}
			return url.protocol === 'http:' ? this.http : this.https;
		} else {
			if (isLocalAddressAllowed && (!this.config.proxy)) {
				return url.protocol === 'http:' ? this.httpNative : this.httpsNative;
			}
			return url.protocol === 'http:' ? this.httpAgent : this.httpsAgent;
		}
	}

	@bindThis
	public async getActivityJson(url: string, isLocalAddressAllowed = false): Promise<IObject> {
		const res = await this.send(url, {
			method: 'GET',
			headers: {
				Accept: 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
			},
			timeout: 5000,
			size: 1024 * 256,
			isLocalAddressAllowed: isLocalAddressAllowed,
		}, {
			throwErrorWhenResponseNotOk: true,
			validators: [validateContentTypeSetAsActivityPub],
		});

		const finalUrl = res.url; // redirects may have been involved
		const activity = await res.json() as IObject;

		assertActivityMatchesUrls(activity, [finalUrl]);

		return activity;
	}

	@bindThis
	public async getJson<T = unknown>(url: string, accept = 'application/json, */*', headers?: Record<string, string>, isLocalAddressAllowed = false): Promise<T> {
		const res = await this.send(url, {
			method: 'GET',
			headers: Object.assign({
				Accept: accept,
			}, headers ?? {}),
			timeout: 5000,
			size: 1024 * 256,
			isLocalAddressAllowed: isLocalAddressAllowed,
		});

		return await res.json() as T;
	}

	@bindThis
	public async getHtml(url: string, accept = 'text/html, */*', headers?: Record<string, string>, isLocalAddressAllowed = false): Promise<string> {
		const res = await this.send(url, {
			method: 'GET',
			headers: Object.assign({
				Accept: accept,
			}, headers ?? {}),
			timeout: 5000,
			isLocalAddressAllowed: isLocalAddressAllowed,
		});

		return await res.text();
	}

	@bindThis
	public async send(
		url: string,
		args: {
			method?: string,
			body?: string,
			headers?: Record<string, string>,
			timeout?: number,
			size?: number,
			isLocalAddressAllowed?: boolean,
		} = {},
		extra: HttpRequestSendOptions = {
			throwErrorWhenResponseNotOk: true,
			validators: [],
		},
	): Promise<Response> {
		const timeout = args.timeout ?? 5000;

		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeout);

		const isLocalAddressAllowed = args.isLocalAddressAllowed ?? false;

		const res = await fetch(url, {
			method: args.method ?? 'GET',
			headers: {
				'User-Agent': this.config.userAgent,
				...(args.headers ?? {}),
			},
			body: args.body,
			size: args.size ?? 10 * 1024 * 1024,
			agent: (url) => this.getAgentByUrl(url, false, isLocalAddressAllowed),
			signal: controller.signal,
		});

		if (!res.ok && extra.throwErrorWhenResponseNotOk) {
			throw new StatusError(`${res.status} ${res.statusText}`, res.status, res.statusText);
		}

		if (res.ok) {
			for (const validator of (extra.validators ?? [])) {
				validator(res);
			}
		}

		return res;
	}
}
