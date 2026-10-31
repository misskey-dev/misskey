/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// スタンドアロン版メディアプロキシでのみ使用するもの

export { mediaProxyPlugin, defaultMediaProxyUserAgent, defaultMediaProxyMaxSize } from './standalone/plugin.js';
export type { MediaProxyPluginOptions, MediaProxyLogger } from './standalone/plugin.js';
export { createHttpAgents } from './standalone/agents.js';
export type { HttpAgents } from './download/http-agent.js';
