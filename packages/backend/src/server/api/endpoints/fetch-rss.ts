import Parser from 'rss-parser';
import { getResponse } from '@/misc/fetch.js';
import config from '@/config/index.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

const rssParser = new Parser();

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 3,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
	},
	required: ['url'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const res = await getResponse({
		url: ps.url,
		method: 'GET',
		headers: Object.assign({
			'User-Agent': config.userAgent,
			Accept: 'application/rss+xml, */*',
		}),
		timeout: 5000,
	});

	const text = await res.text();

	return rssParser.parseString(text);
});
