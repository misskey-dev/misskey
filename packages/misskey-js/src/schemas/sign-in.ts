import type { JSONSchema7Definition } from 'schema-type';

export const SignInSchema = {
	$id: 'https://misskey-hub.net/api/schemas/SignIn',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
        createdAt: {
            type: 'string',
            format: 'date-time',
        },
        ip: {
            type: 'string',
        },
        headers: {
            type: 'object',
        },
        success: {
            type: 'boolean',
        },
	},
	required: [
        'id',
        'createdAt',
        'ip',
        'headers',
        'success',
	],
} as const satisfies JSONSchema7Definition;
