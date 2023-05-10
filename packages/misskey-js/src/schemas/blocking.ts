import type { JSONSchema7Definition } from 'schema-type';

export const packedBlockingSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Blocking',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		blockeeId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		blockee: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
	},
	required: [
		'id',
		'createdAt',
		'blockeeId',
		'blockee',
	],
} as const satisfies JSONSchema7Definition;
