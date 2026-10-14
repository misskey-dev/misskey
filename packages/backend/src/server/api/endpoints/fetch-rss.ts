/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Parser from 'rss-parser';
import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { ApiError } from '../error.js';

const MAX_URL_LENGTH = 8192;
const MAX_RESPONSE_SIZE = 1024 * 1024;
const MAX_CONCURRENT_REQUESTS = 32;

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 3,

	limit: {
		duration: 60 * 1000,
		max: 300,
	},

	errors: {
		invalidUrl: {
			message: 'Invalid URL.',
			code: 'INVALID_URL',
			id: '89b7ee05-ccfc-4bdd-9b13-61172fd1e06c',
			httpStatusCode: 400,
		},
		fetchRssFailed: {
			message: 'Failed to fetch RSS.',
			code: 'FETCH_RSS_FAILED',
			id: '8db5d3d8-31d7-452f-b0cc-ca3b8925de12',
			kind: 'server',
			httpStatusCode: 422,
		},
		fetchRssUnavailable: {
			message: 'RSS fetching is temporarily unavailable.',
			code: 'FETCH_RSS_UNAVAILABLE',
			id: '91e6ff44-c63f-4725-9ad0-b7a40d7f7655',
			kind: 'server',
			httpStatusCode: 503,
		},
	},

	res: v.object({
		image: v.optional(v.object({
			link: v.optional(v.string()),
			url: v.string(),
			title: v.optional(v.string()),
		})),
		paginationLinks: v.optional(v.object({
			self: v.optional(v.string()),
			first: v.optional(v.string()),
			next: v.optional(v.string()),
			last: v.optional(v.string()),
			prev: v.optional(v.string()),
		})),
		link: v.optional(v.string()),
		title: v.optional(v.string()),
		items: v.array(v.object({
			link: v.optional(v.string()),
			guid: v.optional(v.string()),
			title: v.optional(v.string()),
			pubDate: v.optional(v.string()),
			creator: v.optional(v.string()),
			summary: v.optional(v.string()),
			content: v.optional(v.string()),
			isoDate: v.optional(v.string()),
			categories: v.optional(v.array(v.string())),
			contentSnippet: v.optional(v.string()),
			enclosure: v.optional(v.object({
				url: v.string(),
				length: v.optional(v.number()),
				type: v.optional(v.string()),
			})),
		})),
		feedUrl: v.optional(v.string()),
		description: v.optional(v.string()),
		itunes: v.optional(v.pipe(
			v.object({
				image: v.optional(v.string()),
				owner: v.optional(v.object({
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				})),
				author: v.optional(v.string()),
				summary: v.optional(v.string()),
				explicit: v.optional(v.string()),
				categories: v.optional(v.array(v.string())),
				keywords: v.optional(v.array(v.string())),
			}),
			mi.openApi({ additionalProperties: true }),
		)),
	}),
} as const;

export const paramDef = v.object({
	url: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	private readonly inFlightRequests = new Map<string, Promise<Awaited<ReturnType<Parser['parseString']>>>>();
	private activeRequestCount = 0;

	constructor(
		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps) => {
			const url = this.normalizeUrl(ps.url);
			const inFlightRequest = this.inFlightRequests.get(url);
			if (inFlightRequest != null) {
				return await inFlightRequest;
			}

			if (this.activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
				throw new ApiError(meta.errors.fetchRssUnavailable);
			}

			this.activeRequestCount++;
			const request = this.fetchRss(url)
				.catch(() => {
					throw new ApiError(meta.errors.fetchRssFailed);
				})
				.finally(() => {
					this.inFlightRequests.delete(url);
					this.activeRequestCount--;
				});
			this.inFlightRequests.set(url, request);

			return await request;
		});
	}

	private normalizeUrl(input: string): string {
		if (input.length === 0 || input.length > MAX_URL_LENGTH) {
			throw new ApiError(meta.errors.invalidUrl);
		}

		let url: URL;
		try {
			url = new URL(input);
		} catch {
			throw new ApiError(meta.errors.invalidUrl);
		}

		if (
			(url.protocol !== 'http:' && url.protocol !== 'https:') ||
			url.username !== '' ||
			url.password !== ''
		) {
			throw new ApiError(meta.errors.invalidUrl);
		}

		url.hash = '';
		return url.href;
	}

	private async fetchRss(url: string): Promise<Awaited<ReturnType<Parser['parseString']>>> {
		const res = await this.httpRequestService.send(url, {
			method: 'GET',
			headers: {
				Accept: 'application/rss+xml, */*',
			},
			timeout: 5000,
			size: MAX_RESPONSE_SIZE,
		});

		const finalUrl = new URL(res.url);
		if (finalUrl.protocol !== 'http:' && finalUrl.protocol !== 'https:') {
			throw new Error('Invalid final URL protocol');
		}

		const text = await res.text();
		const rssParser = new Parser({
			xml2js: {
				async: true,
			},
		});

		return await rssParser.parseString(text);
	}
}
