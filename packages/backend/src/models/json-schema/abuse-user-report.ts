/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedAbuseUserReportSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		category: {
			type: 'string',
			optional: false, nullable: false,
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		comment: {
			type: 'string',
			optional: false, nullable: false,
		},
		resolved: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		reporterId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		reporter: {
			type: 'object',
			ref: 'UserDetailed',
			optional: false, nullable: false,
		},
		targetUserId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		targetUser: {
			type: 'object',
			ref: 'UserDetailed',
			optional: false, nullable: false,
		},
		assigneeId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		assignee: {
			type: 'object',
			ref: 'UserDetailed',
			optional: true, nullable: true,
		},
		forwarded: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
