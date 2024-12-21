/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteReactionsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				reaction: {
					type: 'string',
					optional: false,
				},
				count: {
					type: 'number',
					optional: false,
				},
			},
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		site: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query =
				this.noteReactionsRepository.createQueryBuilder('nr')
					.select('nr.reaction', 'reaction')
					.addSelect('count(nr.id)', 'count')
					.groupBy('nr.reaction')
					.orderBy('count', 'DESC')
					.limit(100);

			if (!ps.site) {
				query.where('nr.userId = :id', { id: me.id });
			}

			const res = await query.getRawMany();

			return res.map(x => ({
				reaction: x.reaction,
				count: x.count,
			}));
		});
	}
}
