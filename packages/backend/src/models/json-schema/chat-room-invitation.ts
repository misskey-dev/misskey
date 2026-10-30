/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedChatRoomInvitationSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: false,
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
		},
		user: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserLite',
		},
		roomId: {
			type: 'string',
			optional: false, nullable: false,
		},
		room: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'ChatRoom',
		},
	},
} as const;
