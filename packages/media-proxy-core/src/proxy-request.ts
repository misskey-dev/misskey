/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StatusError } from './status-error.js';

export type ProxyQuery = {
	emoji?: string;
	avatar?: string;
	static?: string;
	preview?: string;
	badge?: string;
	origin?: string;
	url?: string;
};

/**
 * プロキシ対象の URL を取得する
 *
 * url クエリを優先し、なければパス部分を https の URL として扱う。
 * どちらも指定されていない場合は null を返す (呼び出し側で 400 を返すこと)
 */
export function getProxyTargetUrl(pathUrl: string | undefined, query: ProxyQuery): string | null {
	const url = 'url' in query ? query.url : (pathUrl ? 'https://' + pathUrl : undefined);

	if (typeof url !== 'string' || url === '') {
		return null;
	}

	return url;
}

/**
 * User-Agent を検証する
 */
export function validateProxyUserAgent(userAgent: string | undefined): void {
	if (!userAgent) {
		throw new StatusError('User-Agent is required', 400, 'User-Agent is required');
	}
	if (userAgent.toLowerCase().indexOf('misskey/') !== -1) {
		throw new StatusError('Refusing to proxy a request from another proxy', 403, 'Proxy is recursive');
	}
}
