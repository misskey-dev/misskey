import type { JSONSchema7Definition } from 'schema-type';

export const packedMutingSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Muting',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		expiresAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, {
				type: 'null',
			}],
		},
		muteeId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		mutee: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
	},
	required: [
		'id',
		'createdAt',
		'expiresAt',
		'muteeId',
		'mutee',
	],
} as const satisfies JSONSchema7Definition;
