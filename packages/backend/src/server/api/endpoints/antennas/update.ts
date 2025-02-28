/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { AntennaService } from '@/core/AntennaService.js';
import { antennaSources } from '@/models/Antenna.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AntennasRepository, UserListsRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '10c673ac-8852-48eb-aa1f-f5b67f069290',
		},

		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7',
		},

		emptyKeyword: {
			message: 'Either keywords or excludeKeywords is required.',
			code: 'EMPTY_KEYWORD',
			id: '721aaff6-4e1b-4d88-8de6-877fae9f68c4',
		},

		invalidRegexPattern: {
			message: 'Invalid regex pattern.',
			code: 'INVALID_REGEX_PATTERN',
			id: 'dbb44ec3-5d15-508d-e6b2-71f3794c6a41',
			httpStatusCode: 400,
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Antenna',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 100 },
		src: { type: 'string', enum: antennaSources },
		keywords: {
			type: 'array',
			items: {
				type: 'array',
				items: { type: 'string' },
			},
		},
		excludeKeywords: {
			type: 'array',
			items: {
				type: 'array',
				items: { type: 'string' },
			},
		},
		users: {
			type: 'array',
			items: { type: 'string' },
		},
		caseSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
		excludeBots: { type: 'boolean' },
		useRegex: { type: 'boolean' },
		withReplies: { type: 'boolean' },
		withFile: { type: 'boolean' },
	},
	required: ['antennaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly antennaEntityService: AntennaEntityService,
		private readonly antennaService: AntennaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				const antenna = await this.antennaService.update(ps, me);
				return this.antennaEntityService.pack(antenna);
			} catch (e) {
				if (e instanceof AntennaService.EmptyKeyWordError) {
					throw new ApiError(meta.errors.emptyKeyword);
				} else if (e instanceof AntennaService.AntennaNotFoundError) {
					throw new ApiError(meta.errors.noSuchAntenna);
				} else if (e instanceof AntennaService.InvalidRegexPatternError) {
					throw new ApiError(meta.errors.invalidRegexPattern);
				} else {
					throw e;
				}
			}
		});
	}
}
