import type { JSONSchema7Reference } from 'json-schema-to-ts';

export const packedNoteSchema = {
	$id: '/schemas/Note',

	type: 'object',
	properties: {
		id: {
			type: 'string',
			$ref: '/schemas/Id',
		},
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
			type: 'string',
			optional: false, nullable: true,
		},
		cw: {
			oneOf: [{ type: 'string' }, { type: 'null' }],
		},
		userId: {
			type: 'string',
			$ref: '/schemas/Id',
		},
		user: {
			type: 'object',
			$ref: '/schemas/UserLite',
		},
		replyId: {
			oneOf: [{
				type: 'string',
				$ref: '/schemas/Id',
			}, { type: 'null' }],
		},
		renoteId: {
			oneOf: [{
				type: 'string',
				$ref: '/schemas/Id',
			}, { type: 'null' }],
		},
		reply: {
			oneOf: [{
				$ref: '/schemas/Note',
			}, { type: 'null' }],
		},
		renote: {
			oneOf: [{
				$ref: '/schemas/Note',
			}, { type: 'null' }],
		},
		isHidden: {
			type: 'boolean',
		},
		visibility: {
			type: 'string',
		},
		mentions: {
			type: 'array',
			items: {
				type: 'string',
				$ref: '/schemas/Id',
			},
		},
		visibleUserIds: {
			type: 'array',
			items: {
				type: 'string',
				$ref: '/schemas/Id',
			},
		},
		fileIds: {
			type: 'array',
			items: {
				type: 'string',
				$ref: '/schemas/Id',
			},
		},
		files: {
			type: 'array',
			items: {
				$ref: '/schemas/DriveFile',
			},
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		poll: {
			oneOf: [{
				type: 'object',
				$ref: '/schemas/Poll',
			}, { type: 'null' }],
		},
		channelId: {
			oneOf: [{
				type: 'string',
				$ref: '/schemas/Id',
			}, { type: 'null' }],
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
				enum: ['likeOnly', 'likeOnlyForRemote']
			}, { type: 'null' }],
		},
		reactions: {
			type: 'object',
		},
		renoteCount: {
			type: 'number',
			optional: false, nullable: false,
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
			type: 'object',
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
} as const satisfies JSONSchema7Reference;
