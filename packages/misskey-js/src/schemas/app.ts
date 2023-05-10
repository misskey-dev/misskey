import type { JSONSchema7Definition } from 'schema-type';

export const packedAppSchema = {
	$id: 'https://misskey-hub.net/api/schemas/App',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		name: {
			type: 'string',
		},
		callbackUrl: {
			type: ['string', 'null'],
		},
		permission: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		secret: {
			type: 'string',
		},
		isAuthorized: {
			type: 'boolean',
		},
	},
	required: [
		'id',
		'name',
		'callbackUrl',
		'permission',
	],
} as const satisfies JSONSchema7Definition;
