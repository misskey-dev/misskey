import * as http from 'node:http';
import * as https from 'node:https';
import { LookupFunction } from 'node:net';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { Inject, Injectable } from '@nestjs/common';
import * as undici from 'undici';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import { bindThis } from '@/decorators.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';

// true to allow, false to deny
export type IpChecker = (ip: string) => boolean;

/* 
 *  Child class to create and save Agent for fetch.
 *  You should construct this when you want
 *  to change timeout, size limit, socket connect function, etc.
 */
export class UndiciFetcher {
	/**
	 * Get http non-proxy agent (undici)
	 */
	public nonProxiedAgent: undici.Agent;

	/**
	 * Get http proxy or non-proxy agent (undici)
	 */
	public agent: undici.ProxyAgent | undici.Agent;

	private proxyBypassHosts: string[];
	private userAgent: string | undefined;

	private logger: Logger | undefined;

	constructor(
		args: {
			agentOptions: undici.Agent.Options;
			proxy?: {
				uri: string;
				options?: undici.Agent.Options; // Override of agentOptions
			},
			proxyBypassHosts?: string[];
			userAgent?: string;
		},
		logger?: Logger,
	) {
		this.logger = logger;
		this.logger?.debug('UndiciFetcher constructor', args);

		this.proxyBypassHosts = args.proxyBypassHosts ?? [];
		this.userAgent = args.userAgent;

		this.nonProxiedAgent = new undici.Agent({
			...args.agentOptions,
			connect: (process.env.NODE_ENV !== 'production' && typeof args.agentOptions.connect !== 'function')
				? (options, cb) => {
					// Custom connector for debug
					undici.buildConnector(args.agentOptions.connect as undici.buildConnector.BuildOptions)(options, (err, socket) => {
						this.logger?.debug('Socket connector called', socket);
						if (err) {
							this.logger?.debug('Socket error', err);
							cb(new Error(`Error while socket connecting\n${err}`), null);
							return;
						}
						this.logger?.debug(`Socket connected: port ${socket.localPort} => remote ${socket.remoteAddress}`);
						cb(null, socket);
					});
				} : args.agentOptions.connect,
		});

		this.agent = args.proxy
			? new undici.ProxyAgent({
				...args.agentOptions,
				...args.proxy.options,

				uri: args.proxy.uri,

				connect: (process.env.NODE_ENV !== 'production' && typeof (args.proxy.options?.connect ?? args.agentOptions.connect) !== 'function')
					? (options, cb) => {
						// Custom connector for debug
						undici.buildConnector((args.proxy?.options?.connect ?? args.agentOptions.connect) as undici.buildConnector.BuildOptions)(options, (err, socket) => {
							this.logger?.debug('Socket connector called (secure)', socket);
							if (err) {
								this.logger?.debug('Socket error', err);
								cb(new Error(`Error while socket connecting\n${err}`), null);
								return;
							}
							this.logger?.debug(`Socket connected (secure): port ${socket.localPort} => remote ${socket.remoteAddress}`);
							cb(null, socket);
						});
					} : (args.proxy.options?.connect ?? args.agentOptions.connect),
			})
			: this.nonProxiedAgent;
	}

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getAgentByUrl(url: URL, bypassProxy = false): undici.Agent | undici.ProxyAgent {
		if (bypassProxy || this.proxyBypassHosts.includes(url.hostname)) {
			return this.nonProxiedAgent;
		} else {
			return this.agent;
		}
	}

	@bindThis
	public async fetch(
		url: string | URL,
		options: undici.RequestInit = {},
		privateOptions: { noOkError?: boolean; bypassProxy?: boolean; } = { noOkError: false, bypassProxy: false },
	): Promise<undici.Response> {
		const res = await undici.fetch(url, {
			dispatcher: this.getAgentByUrl(new URL(url), privateOptions.bypassProxy),
			...options,
			headers: {
				'User-Agent': this.userAgent ?? '',
				...(options.headers ?? {}),
			},
		}).catch((err) => {
			this.logger?.error(`fetch error to ${typeof url === 'string' ? url : url.href}`, err);
			throw new StatusError('Resource Unreachable', 500, 'Resource Unreachable');
		});
		if (!res.ok && !privateOptions.noOkError) {
			throw new StatusError(`${res.status} ${res.statusText}`, res.status, res.statusText);
		}
		return res;
	}

	@bindThis
	public async request(
		url: string | URL,
		options: { dispatcher?: undici.Dispatcher } & Omit<undici.Dispatcher.RequestOptions, 'origin' | 'path' | 'method'> & Partial<Pick<undici.Dispatcher.RequestOptions, 'method'>> = {},
		privateOptions: { noOkError?: boolean; bypassProxy?: boolean; } = { noOkError: false, bypassProxy: false },
	): Promise<undici.Dispatcher.ResponseData> {
		const res = await undici.request(url, {
			dispatcher: this.getAgentByUrl(new URL(url), privateOptions.bypassProxy),
			...options,
			headers: {
				'user-agent': this.userAgent ?? '',
				...(options.headers ?? {}),
			},
		}).catch((err) => {
			this.logger?.error(`fetch error to ${typeof url === 'string' ? url : url.href}`, err);
			throw new StatusError('Resource Unreachable', 500, 'Resource Unreachable');
		});

		if (res.statusCode >= 400) {
			throw new StatusError(`${res.statusCode}`, res.statusCode, '');
		}

		return res;
	}

	@bindThis
	public async getJson<T extends unknown>(url: string, accept = 'application/json, */*', headers?: Record<string, string>): Promise<T> {
		const { body } = await this.request( 
			url,
			{
				headers: Object.assign({
					Accept: accept,
				}, headers ?? {}),
			},
		);

		return await body.json() as T;
	}

	@bindThis
	public async getHtml(url: string, accept = 'text/html, */*', headers?: Record<string, string>): Promise<string> {
		const { body } = await this.request(
			url,
			{
				headers: Object.assign({
					Accept: accept,
				}, headers ?? {}),
			},
		);

		return await body.text();
	}
}

@Injectable()
export class HttpRequestService {
	public defaultFetcher: UndiciFetcher;
	public fetch: UndiciFetcher['fetch'];
	public request: UndiciFetcher['request'];
	public getHtml: UndiciFetcher['getHtml'];
	public defaultJsonFetcher: UndiciFetcher;
	public getJson: UndiciFetcher['getJson'];

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
	private maxSockets: number;

	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('http-request');

		this.dnsCache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});

		this.clientDefaults = {
			keepAliveTimeout: 30 * 1000,
			keepAliveMaxTimeout: 10 * 60 * 1000,
			keepAliveTimeoutThreshold: 1 * 1000,
			strictContentLength: true,
			headersTimeout: 10 * 1000,
			bodyTimeout: 10 * 1000,
			maxHeaderSize: 16364, // default
			maxResponseSize: 10 * 1024 * 1024,
			maxRedirections: 3,
			connect: {
				timeout: 10 * 1000, // コネクションが確立するまでのタイムアウト
				maxCachedSessions: 300, // TLSセッションのキャッシュ数 https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L80
				lookup: this.dnsCache.lookup as LookupFunction, // https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L98
			},
		};

		this.maxSockets = Math.max(64, ((this.config.deliverJobConcurrency ?? 128) / (this.config.clusterLimit ?? 1)));

		this.defaultFetcher = this.createFetcher({}, {}, this.logger);

		this.fetch = this.defaultFetcher.fetch;
		this.request = this.defaultFetcher.request;
		this.getHtml = this.defaultFetcher.getHtml;

		this.defaultJsonFetcher = this.createFetcher({
			maxResponseSize: 1024 * 256,
		}, {}, this.logger);

		this.getJson = this.defaultJsonFetcher.getJson;

		//#region for old http/https, only used in S3Service
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

		this.httpAgent = config.proxy
			? new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: this.maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.http;

		this.httpsAgent = config.proxy
			? new HttpsProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: this.maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.https;
		//#endregion
	}

	@bindThis
	private getStandardUndiciFetcherOption(opts: undici.Agent.Options = {}, proxyOpts: undici.Agent.Options = {}) {
		return {
			agentOptions: {
				...this.clientDefaults,
				...opts,
			},
			...(this.config.proxy ? {
				proxy: {
					uri: this.config.proxy,
					options: {
						connections: this.maxSockets,
						...proxyOpts,
					},
				},
			} : {}),
			userAgent: this.config.userAgent,
		};
	}

	@bindThis
	public createFetcher(opts: undici.Agent.Options = {}, proxyOpts: undici.Agent.Options = {}, logger: Logger) {
		return new UndiciFetcher(this.getStandardUndiciFetcherOption(opts, proxyOpts), logger);
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
	public getConnectorWithIpCheck(connector: undici.buildConnector.connector, checkIp: IpChecker): undici.buildConnector.connectorAsync {
		return (options, cb) => {
			connector(options, (err, socket) => {
				this.logger.debug('Socket connector (with ip checker) called', socket);
				if (err) {
					this.logger.error('Socket error', err);
					cb(new Error(`Error while socket connecting\n${err}`), null);
					return;
				}

				if (socket.remoteAddress == undefined) {
					this.logger.error('Socket error: remoteAddress is undefined');
					cb(new Error('remoteAddress is undefined (maybe socket destroyed)'), null);
					return;
				}

				// allow
				if (checkIp(socket.remoteAddress)) {
					this.logger.debug(`Socket connected (ip ok): ${socket.localPort} => ${socket.remoteAddress}`);
					cb(null, socket);
					return;
				}

				this.logger.error('IP is not allowed', socket);
				cb(new StatusError('IP is not allowed', 403, 'IP is not allowed'), null);
				socket.destroy();
			});
		};
	}
}
