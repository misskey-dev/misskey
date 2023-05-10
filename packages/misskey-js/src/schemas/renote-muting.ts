import type { JSONSchema7Definition } from 'schema-type';

export const packedRenoteMutingSchema = {
	$id: 'https://misskey-hub.net/api/schemas/RenoteMuting',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		muteeId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		mutee: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
	},
	required: [
		'id',
		'createdAt',
		'muteeId',
		'mutee',
	],
} as const satisfies JSONSchema7Definition;
