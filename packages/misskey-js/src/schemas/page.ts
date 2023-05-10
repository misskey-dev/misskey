import type { JSONSchema7Definition } from 'schema-type';

export const packedPageSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Page',

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
		name: {
			type: 'string',
		},
		summary: {
			type: ['string', 'null'],
		},
		content: {
			type: 'array',
		},
		variables: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
	},
	required: [
		'id',
		'createdAt',
		'updatedAt',
		'title',
		'name',
		'summary',
		'content',
		'variables',
		'userId',
		'user',
	],
} as const satisfies JSONSchema7Definition;
