import type { JSONSchema7Definition } from 'schema-type';

export const packedFlashSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Flash',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		updatedAt: {
			type: 'string',
			format: 'date-time',
		},
		title: {
			type: 'string',
		},
		summary: {
			type: 'string',
		},
		script: {
			type: 'string',
		},
		userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
		likedCount: {
			type: ['number', 'null'],
		},
		isLiked: {
			type: 'boolean',
		},
	},
	required: [
		'id',
		'createdAt',
		'updatedAt',
		'title',
		'summary',
		'script',
		'userId',
		'user',
		'likedCount',
	],
} as const satisfies JSONSchema7Definition;
