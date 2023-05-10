import type { JSONSchema7Definition } from 'schema-type';

export const packedClipSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Clip',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		lastClippedAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, {
				type: 'null',
			}],
		},
		userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
		name: {
			type: 'string',
		},
		description: {
			type: ['string', 'null'],
		},
		isPublic: {
			type: 'boolean',
		},
		isFavorited: {
			type: 'boolean',
		},
		favoritedCount: {
			type: 'number',
		},
	},
	required: [
		'id',
		'createdAt',
		'lastClippedAt',
		'userId',
		'user',
		'name',
		'description',
		'isPublic',
		'favoritedCount',
	],
} as const satisfies JSONSchema7Definition;
