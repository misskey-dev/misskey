import type { JSONSchema7Definition } from 'schema-type';
import { ACHIEVEMENT_TYPES } from '../consts';

export const packedNotificationSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Notification',

	type: 'object',
	allOf: [{
		type: 'object',
		properties: {
			id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
			createdAt: {
				type: 'string',
				format: 'date-time',
			},
		},
		required: ['id', 'createdAt'],
	}, {
		oneOf: [
		{
			type: 'object',
			properties: {
				type: { const: 'follow' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
			},
			required: ['type', 'userId', 'user'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'mention' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'reply' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'renote' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'quote' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'reaction' },
				reaction: { type: 'string' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'reaction', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'pollEnded' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
				note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
			},
			required: ['type', 'userId', 'user', 'note'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'receiveFollowRequest' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
			},
			required: ['type', 'userId', 'user'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'followRequestAccepted' },
				userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
			},
			required: ['type', 'userId', 'user'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'achievementEarned' },
				achievement: { enum: [...ACHIEVEMENT_TYPES] },
			},
			required: ['type', 'achievement'],
		}, {
			type: 'object',
			properties: {
				type: { const: 'app' },
				header: { type: ['string', 'null'] },
				body: { type: 'string' },
				icon: { type: ['string', 'null'] },
			},
			required: ['type'],
		}],
	}],
} as const satisfies JSONSchema7Definition;
