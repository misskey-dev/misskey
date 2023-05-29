import type { JSONSchema7Definition } from 'schema-type';

export const packedModerationLogSchema = {
	$id: 'https://misskey-hub.net/api/schemas/ModerationLog',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
        type: {
            type: 'string',
        },
        info: {
            type: 'object',
        },
        userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
        user: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
	},
	required: [
		'id',
		'createdAt',
        'type',
        'info',
        'userId',
        'user',
	],
} as const satisfies JSONSchema7Definition;
