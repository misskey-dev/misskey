import type { JSONSchema7Definition } from 'schema-type';

export const packedRoleSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Role',

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
        name: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        color: {
            type: ['string', 'null'],
        },
        iconUrl: {
            type: ['string', 'null'],
        },
        target: {
            enum: [
                'manual',
                'conditional',
            ],
        }
	},
	required: [
		'id',
		'createdAt',
        'updatedAt',
	],
}

export const packedRoleAssignSchema = {
	$id: 'https://misskey-hub.net/api/schemas/RoleAssign',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
        user: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
        expiresAt: {
            oneOf: [{
                type: 'string',
                format: 'date-time',
            }, {
                type: 'null',
            }],
        },
	},
	required: [
		'id',
		'createdAt',
        'user',
        'expiresAt',
	],
} as const satisfies JSONSchema7Definition;
