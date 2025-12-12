/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Parser from 'rss-parser';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

const rssParser = new Parser();

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 3,

	res: {
		type: 'object',
		properties: {
			image: {
				type: 'object',
				optional: true,
				properties: {
					link: {
						type: 'string',
						optional: true,
					},
					url: {
						type: 'string',
						optional: false,
					},
					title: {
						type: 'string',
						optional: true,
					},
				},
			},
			paginationLinks: {
				type: 'object',
				optional: true,
				properties: {
					self: {
						type: 'string',
						optional: true,
					},
					first: {
						type: 'string',
						optional: true,
					},
					next: {
						type: 'string',
						optional: true,
					},
					last: {
						type: 'string',
						optional: true,
					},
					prev: {
						type: 'string',
						optional: true,
					},
				},
			},
			link: {
				type: 'string',
				optional: true,
			},
			title: {
				type: 'string',
				optional: true,
			},
			items: {
				type: 'array',
				optional: false,
				items: {
					type: 'object',
					properties: {
						link: {
							type: 'string',
							optional: true,
						},
						guid: {
							type: 'string',
							optional: true,
						},
						title: {
							type: 'string',
							optional: true,
						},
						pubDate: {
							type: 'string',
							optional: true,
						},
						creator: {
							type: 'string',
							optional: true,
						},
						summary: {
							type: 'string',
							optional: true,
						},
						content: {
							type: 'string',
							optional: true,
						},
						isoDate: {
							type: 'string',
							optional: true,
						},
						categories: {
							type: 'array',
							optional: true,
							items: {
								type: 'string',
							},
						},
						contentSnippet: {
							type: 'string',
							optional: true,
						},
						enclosure: {
							type: 'object',
							optional: true,
							properties: {
								url: {
									type: 'string',
									optional: false,
								},
								length: {
									type: 'number',
									optional: true,
								},
								type: {
									type: 'string',
									optional: true,
								},
							},
						},
					},
				},
			},
			feedUrl: {
				type: 'string',
				optional: true,
			},
			description: {
				type: 'string',
				optional: true,
			},
			itunes: {
				type: 'object',
				optional: true,
				additionalProperties: true,
				properties: {
					image: {
						type: 'string',
						optional: true,
					},
					owner: {
						type: 'object',
						optional: true,
						properties: {
							name: {
								type: 'string',
								optional: true,
							},
							email: {
								type: 'string',
								optional: true,
							},
						},
					},
					author: {
						type: 'string',
						optional: true,
					},
					summary: {
						type: 'string',
						optional: true,
					},
					explicit: {
						type: 'string',
						optional: true,
					},
					categories: {
						type: 'array',
						optional: true,
						items: {
							type: 'string',
						},
					},
					keywords: {
						type: 'array',
						optional: true,
						items: {
							type: 'string',
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
	},
	required: ['url'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const res = await this.httpRequestService.send(ps.url, {
				method: 'GET',
				headers: {
					Accept: 'application/rss+xml, */*',
				},
				timeout: 5000,
			});

			const text = await res.text();

			return rssParser.parseString(text);
		});
	}
}
