/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { AntennaService } from '@/core/AntennaService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { antennaSources } from '@/models/Antenna.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
		},

		tooManyAntennas: {
			message: 'You cannot create antenna any more.',
			code: 'TOO_MANY_ANTENNAS',
			id: 'faf47050-e8b5-438c-913c-db2b1576fde4',
		},

		emptyKeyword: {
			message: 'Either keywords or excludeKeywords is required.',
			code: 'EMPTY_KEYWORD',
			id: '53ee222e-1ddd-4f9a-92e5-9fb82ddb463a',
		},

		invalidRegexPattern: {
			message: 'Invalid regex pattern.',
			code: 'INVALID_REGEX_PATTERN',
			id: 'b06d08f4-6434-5faa-0fdd-a2aaf85e9de7',
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
	required: [
		'name',
		'src',
		'keywords',
		'excludeKeywords',
		'users',
		'caseSensitive',
		'withReplies',
		'withFile',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly antennaEntityService: AntennaEntityService,
		private readonly antennaService: AntennaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				const antenna = await this.antennaService.create(ps, me);
				return this.antennaEntityService.pack(antenna);
			} catch (e) {
				if (e instanceof AntennaService.EmptyKeyWordError) {
					throw new ApiError(meta.errors.emptyKeyword);
				} else if (e instanceof AntennaService.TooManyAntennasError) {
					throw new ApiError(meta.errors.tooManyAntennas);
				} else if (e instanceof AntennaService.InvalidRegexPatternError) {
					throw new ApiError(meta.errors.invalidRegexPattern);
				} else {
					throw e;
				}
			}
		});
	}
}
