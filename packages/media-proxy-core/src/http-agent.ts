/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as http from 'node:http';
import * as https from 'node:https';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import ipaddr from 'ipaddr.js';
import type { LookupFunction } from 'node:net';

export type HttpAgents = {
	http: http.Agent;
	https: https.Agent;
};

let defaultAgents: HttpAgents | null = null;

/**
 * DNS キャッシュ付きの keep-alive エージェントを作成する
 *
 * proxy を指定した場合は HTTP プロキシ経由のエージェントを作成する
 */
export function createHttpAgents(proxy?: string): HttpAgents {
	if (proxy) {
		return {
			http: new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: 256,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy,
			}),
			https: new HttpsProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: 256,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy,
			}),
		};
	}

	if (defaultAgents == null) {
		const cache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});

		defaultAgents = {
			http: new http.Agent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				lookup: cache.lookup as unknown as LookupFunction,
			}),
			https: new https.Agent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				lookup: cache.lookup as unknown as LookupFunction,
			}),
		};
	}

	return defaultAgents;
}

/**
 * IP アドレスがプライベートアドレス（unicast 以外）かどうかを判定する
 *
 * allowedPrivateNetworks に含まれるアドレスはプライベートとして扱わない
 */
export function isPrivateIp(ip: string, allowedPrivateNetworks: string[] = []): boolean {
	// IPv4-mapped IPv6 アドレスは IPv4 アドレスとして扱う
	const parsedIp = ipaddr.process(ip);

	for (const net of allowedPrivateNetworks) {
		const cidr = ipaddr.parseCIDR(net);
		if (cidr[0].kind() === parsedIp.kind() && parsedIp.match(cidr)) {
			return false;
		}
	}

	return parsedIp.range() !== 'unicast';
}
