import type { JSONSchema7Definition } from 'schema-type';

export const packedAntennaSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Antenna',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		name: {
			type: 'string',
		},
		keywords: {
			type: 'array',
			items: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
		},
		excludeKeywords: {
			type: 'array',
			items: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
		},
		src: {
			type: 'string',
			enum: ['home', 'all', 'users', 'list'],
		},
		userListId: {
			oneOf: [{
				type: 'string',
				format: 'id',
			}, {
				type: 'null',
			}],
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		caseSensitive: {
			type: 'boolean',
			default: false,
		},
		notify: {
			type: 'boolean',
		},
		withReplies: {
			type: 'boolean',
			default: false,
		},
		withFile: {
			type: 'boolean',
		},
		isActive: {
			type: 'boolean',
		},
		hasUnreadNote: {
			type: 'boolean',
			default: false,
		},
	},
	required: [
		'id',
		'createdAt',
		'name',
		'keywords',
		'excludeKeywords',
		'src',
		'userListId',
		'users',
		'caseSensitive',
		'notify',
		'withReplies',
		'withFile',
		'isActive',
		'hasUnreadNote',
	],
} as const satisfies JSONSchema7Definition;
