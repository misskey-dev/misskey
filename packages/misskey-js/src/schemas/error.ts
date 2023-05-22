import type { JSONSchema7Definition } from 'schema-type';

export const Error = {
	$id: 'https://misskey-hub.net/api/schemas/Error',

    type: 'object',
    description: 'An error object.',
    properties: {
        code: {
            type: 'string',
            description: 'An error code. Unique within the endpoint.',
        },
        message: {
            type: 'string',
            description: 'An error message.',
        },
        id: {
            type: 'string',
            format: 'uuid',
            description: 'An error ID. This ID is static.',
        },
    },
    required: ['code', 'id', 'message'],
} as const satisfies JSONSchema7Definition;

export const ApiError = {
	$id: 'https://misskey-hub.net/api/schemas/ApiError',

	type: 'object',
	properties: {
		error: { $ref: 'https://misskey-hub.net/api/schemas/Error' },
	},
	required: ['error'],
} as const satisfies JSONSchema7Definition;
