/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as stream from 'node:stream/promises';
import got, * as Got from 'got';
import { parse } from 'content-disposition';
import { StatusError } from './status-error.js';
import { createHttpAgents, isPrivateIp } from './http-agent.js';

export type DownloadLogger = {
	warn(message: string, error?: unknown): void;
};

export type DownloadOptions = {
	userAgent: string;
	maxSize: number;

	/**
	 * リクエストごと（リダイレクト先を含む）に使用するエージェントを返す
	 *
	 * 指定した場合、接続先 IP アドレスの検証はエージェント側の責務となり、本関数では行わない。
	 * 省略した場合は既定のエージェントを使用し、レスポンス受信時に接続先がプライベートアドレスであれば中断する。
	 */
	getAgents?: (url: URL) => Got.Agents;

	/**
	 * getAgents を省略した場合に接続を許可するプライベートネットワーク (CIDR)
	 */
	allowedPrivateNetworks?: string[];

	logger?: DownloadLogger;
};

export async function downloadUrl(url: string, path: string, options: DownloadOptions): Promise<{
	filename: string;
}> {
	const timeout = 30 * 1000;
	const operationTimeout = 60 * 1000;
	const { maxSize, logger } = options;

	const getAgents = options.getAgents ?? (() => createHttpAgents());
	const checkAddress = options.getAgents == null;
	let blockedAddress: string | null = null;

	const urlObj = new URL(url);
	let filename = urlObj.pathname.split('/').pop() ?? 'untitled';

	const req = got.stream(url, {
		headers: {
			'User-Agent': options.userAgent,
		},
		timeout: {
			lookup: timeout,
			connect: timeout,
			secureConnect: timeout,
			socket: timeout,	// read timeout
			response: timeout,
			send: timeout,
			request: operationTimeout,	// whole operation timeout
		},
		agent: getAgents(urlObj),
		hooks: {
			beforeRedirect: [
				(redirectOptions) => {
					// リダイレクト先ごとにエージェントを選択し直し、
					// プロキシ除外ホスト経由のリダイレクトでローカルアドレスチェックが素通しになるのを防ぐ
					const redirectUrl = redirectOptions.url;
					if (redirectUrl == null) return;
					redirectOptions.agent = getAgents(new URL(redirectUrl));
				},
			],
		},
		http2: false,	// default
		retry: {
			limit: 0,
		},
		enableUnixSockets: false,
	}).on('response', (res: Got.Response) => {
		if (checkAddress && res.ip != null && isPrivateIp(res.ip, options.allowedPrivateNetworks)) {
			blockedAddress = res.ip;
			logger?.warn(`Blocked address: ${res.ip}`);
			req.destroy();
			return;
		}

		const contentLength = res.headers['content-length'];
		if (contentLength != null) {
			const size = Number(contentLength);
			if (size > maxSize) {
				logger?.warn(`maxSize exceeded (${size} > ${maxSize}) on response`);
				req.destroy();
			}
		}

		const contentDisposition = res.headers['content-disposition'];
		if (contentDisposition != null) {
			try {
				const parsed = parse(contentDisposition);
				if (parsed.parameters.filename) {
					filename = parsed.parameters.filename;
				}
			} catch (e) {
				logger?.warn(`Failed to parse content-disposition: ${contentDisposition}`, e);
			}
		}
	}).on('downloadProgress', (progress: Got.Progress) => {
		if (progress.transferred > maxSize) {
			logger?.warn(`maxSize exceeded (${progress.transferred} > ${maxSize}) on downloadProgress`);
			req.destroy();
		}
	});

	try {
		await stream.pipeline(req, fs.createWriteStream(path));
	} catch (e) {
		if (blockedAddress != null) {
			throw new StatusError(`Blocked address: ${blockedAddress}`, 400, 'Private IP Rejected');
		} else if (e instanceof Got.HTTPError) {
			throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
		} else {
			throw e;
		}
	}

	return {
		filename,
	};
}
