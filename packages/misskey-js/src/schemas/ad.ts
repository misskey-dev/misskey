import type { JSONSchema7Definition } from 'schema-type';

export const packedAdSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Ad',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		expiresAt: {
			type: 'string',
			format: 'date-time',
		},
		startsAt: {
			type: 'string',
			format: 'date-time',
		},
        place: {
            type: 'string',
        },
        property: {
            type: 'string',
        },
        ratio: {
            type: 'number',
        },
        imageUrl: {
            type: ['string', 'null'],
        },
        memo: {
            type: 'string',
        },
    },
    required: [
        'id',
        'createdAt',
        'expiresAt',
        'startsAt',
        'place',
        'property',
        'ratio',
        'imageUrl',
        'memo',
    ],
} as const satisfies JSONSchema7Definition;
