/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedReversiGameLiteSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		startedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		endedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		isStarted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isEnded: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		user1Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user2Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user1: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserLite',
		},
		user2: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserLite',
		},
		winnerId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		winner: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'UserLite',
		},
		surrenderedUserId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		timeoutUserId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		black: {
			type: 'number',
			optional: false, nullable: true,
		},
		bw: {
			type: 'string',
			optional: false, nullable: false,
		},
		noIrregularRules: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isLlotheo: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canPutEverywhere: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		loopedBoard: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		timeLimitForEachTurn: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedReversiGameDetailedSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		startedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		endedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		isStarted: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isEnded: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		form1: {
			type: 'object',
			optional: false, nullable: true,
		},
		form2: {
			type: 'object',
			optional: false, nullable: true,
		},
		user1Ready: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		user2Ready: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		user1Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user2Id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user1: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserLite',
		},
		user2: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserLite',
		},
		winnerId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		winner: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'UserLite',
		},
		surrenderedUserId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		timeoutUserId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		black: {
			type: 'number',
			optional: false, nullable: true,
		},
		bw: {
			type: 'string',
			optional: false, nullable: false,
		},
		noIrregularRules: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isLlotheo: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canPutEverywhere: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		loopedBoard: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		timeLimitForEachTurn: {
			type: 'number',
			optional: false, nullable: false,
		},
		logs: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'number',
				},
			},
		},
		map: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;
