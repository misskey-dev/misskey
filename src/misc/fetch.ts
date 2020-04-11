import * as http from 'http';
import * as https from 'https';
import * as cache from 'lookup-dns-cache';
import fetch, { HeadersInit } from 'node-fetch';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import config from '../config';

export async function getJson(url: string, accept = 'application/json, */*', timeout = 10000, headers?: HeadersInit) {
	const res = await fetch(url, {
		headers: Object.assign({
			'User-Agent': config.userAgent,
			Accept: accept
		}, headers || {}),
		timeout,
		agent: getAgentByUrl,
	});

	if (!res.ok) {
		throw {
			name: `StatusError`,
			statusCode: res.status,
			message: `${res.status} ${res.statusText}`,
		};
	}

	return await res.json();
}

const _http = new http.Agent({
	keepAlive: true,
	keepAliveMsecs: 30 * 1000,
});

const _https = new https.Agent({
	keepAlive: true,
	keepAliveMsecs: 30 * 1000,
	lookup: cache.lookup,
});

export const httpAgent = config.proxy
	? new HttpProxyAgent(config.proxy)
	: _http;

export const httpsAgent = config.proxy
	? new HttpsProxyAgent(config.proxy)
	: _https;

export function getAgentByUrl(url: URL) {
	if ((config.proxyBypassHosts || []).includes(url.hostname)) {
		return url.protocol == 'http:' ? _http : _https;
	} else {
		return url.protocol == 'http:' ? httpAgent : httpsAgent;
	}
}
