import type { JSONSchema7Definition } from 'schema-type';

export const packedNoteSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Note',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		deletedAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, { type: 'null' }],
		},
		text: {
			type: ['string', 'null'],
		},
		cw: {
			type: ['string', 'null'],
		},
		userId: {
			$ref: 'https://misskey-hub.net/api/schemas/Id',
		},
		user: {
			$ref: 'https://misskey-hub.net/api/schemas/UserLite',
		},
		replyId: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Id' }, { type: 'null' }],
		},
		renoteId: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Id' }, { type: 'null' }],
		},
		reply: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Note' }, { type: 'null' }],
		},
		renote: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Note' }, { type: 'null' }],
		},
		isHidden: {
			type: 'boolean',
		},
		visibility: {
			type: 'string',
		},
		mentions: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		visibleUserIds: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		fileIds: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		files: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/DriveFile' },
		},
		tags: {
			type: 'array',
			items: { type: 'string' },
		},
		poll: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Poll' }, { type: 'null' }],
		},
		channelId: {
			oneOf: [{ $ref: 'https://misskey-hub.net/api/schemas/Id' }, { type: 'null' }],
		},
		channel: {
			oneOf: [{
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					color: { type: 'string' },
				},
				required: ['id', 'name', 'color'],
			}, { type: 'null' }],
		},
		localOnly: {
			type: 'boolean',
		},
		reactionAcceptance: {
			oneOf: [{
				enum: ['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote']
			}, { type: 'null' }],
		},
		reactions: {
			type: 'object',
		},
		renoteCount: {
			type: 'number',
		},
		repliesCount: {
			type: 'number',
		},
		uri: {
			type: 'string',
		},
		url: {
			type: 'string',
		},
		myReaction: {
			type: 'string',
		},
	},
	required: [
		'id',
		'createdAt',
		'text',
		'userId',
		'user',
		'visibility',
		'reactionAcceptance',
		'reactions',
		'renoteCount',
		'repliesCount',
	],
} as const satisfies JSONSchema7Definition;
