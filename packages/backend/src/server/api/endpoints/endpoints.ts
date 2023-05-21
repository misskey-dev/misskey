import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { endpoints } from 'misskey-js/built/endpoints.js';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
		},
		example: [
			'admin/abuse-user-reports',
			'admin/accounts/create',
			'admin/announcements/create',
			'...',
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// !!!!!!!!!!!!!!!!!!!!!!!!DONE!!!!!!!!!!!!!!!!!!!!!!!!!!!

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'endpoints'> {
	name = 'endpoints' as const;
	constructor(
	) {
		super(async () => {
			return Object.keys(endpoints);
		});
	}
}
