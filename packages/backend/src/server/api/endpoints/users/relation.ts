/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:account',

	description: 'Show the different kinds of relations between the authenticated user and the specified user(s).',

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				properties: {
					id: {
						type: 'string',
						optional: false, nullable: false,
						format: 'id',
					},
					isFollowing: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hasPendingFollowRequestFromYou: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hasPendingFollowRequestToYou: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isFollowed: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isBlocking: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isBlocked: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isMuted: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isRenoteMuted: {
						type: 'boolean',
						optional: false, nullable: false,
					},
				},
			},
			{
				type: 'array',
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'id',
						},
						isFollowing: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						hasPendingFollowRequestFromYou: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						hasPendingFollowRequestToYou: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isFollowed: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isBlocking: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isBlocked: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isMuted: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isRenoteMuted: {
							type: 'boolean',
							optional: false, nullable: false,
						},
					},
				},
			},
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: {
			anyOf: [
				{ type: 'string', format: 'misskey:id' },
				{
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
				},
			],
		},
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

			const relations = await Promise.all(ids.map(id => this.userEntityService.getRelation(me.id, id)));

			return Array.isArray(ps.userId) ? relations : relations[0];
		});
	}
}
