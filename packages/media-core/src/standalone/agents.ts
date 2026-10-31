/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { getDefaultAgents } from '../download/http-agent.js';
import type { HttpAgents } from '../download/http-agent.js';

/**
 * ダウンロードに使用するエージェントを作成する
 *
 * proxy を指定した場合は HTTP プロキシ経由のエージェントを、
 * 省略した場合は DNS キャッシュ付きの keep-alive エージェントを返す
 */
export function createHttpAgents(proxy?: string): HttpAgents {
	if (!proxy) return getDefaultAgents();

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
