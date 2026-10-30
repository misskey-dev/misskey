/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedQueueCountSchema = {
	type: 'object',
	properties: {
		waiting: {
			type: 'number',
			optional: false, nullable: false,
		},
		active: {
			type: 'number',
			optional: false, nullable: false,
		},
		completed: {
			type: 'number',
			optional: false, nullable: false,
		},
		failed: {
			type: 'number',
			optional: false, nullable: false,
		},
		delayed: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;

// Bull.Metrics
export const packedQueueMetricsSchema = {
	type: 'object',
	properties: {
		meta: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				count: {
					type: 'number',
					optional: false, nullable: false,
				},
				prevTS: {
					type: 'number',
					optional: false, nullable: false,
				},
				prevCount: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
		data: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
		count: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedQueueJobSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		data: {
			type: 'object',
			optional: false, nullable: false,
		},
		opts: {
			type: 'object',
			optional: false, nullable: false,
		},
		timestamp: {
			type: 'number',
			optional: false, nullable: false,
		},
		processedOn: {
			type: 'number',
			optional: true, nullable: false,
		},
		processedBy: {
			type: 'string',
			optional: true, nullable: false,
		},
		finishedOn: {
			type: 'number',
			optional: true, nullable: false,
		},
		progress: {
			type: 'object',
			optional: false, nullable: false,
		},
		attempts: {
			type: 'number',
			optional: false, nullable: false,
		},
		delay: {
			type: 'number',
			optional: false, nullable: false,
		},
		failedReason: {
			type: 'string',
			optional: false, nullable: false,
		},
		stacktrace: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		returnValue: {
			type: 'object',
			optional: false, nullable: false,
		},
		isFailed: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
