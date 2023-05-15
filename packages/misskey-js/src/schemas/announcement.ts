import type { JSONSchema7Definition } from 'schema-type';

export const packedAnnouncementSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Announcement',

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
        text: {
            type: 'string',
        },
        imageUrl: {
            type: ['string', 'null'],
        },
    },
    required: [
        'id',
        'createdAt',
        'updatedAt',
        'title',
        'text',
        'imageUrl',
    ],
} as const satisfies JSONSchema7Definition;
