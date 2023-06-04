import type { JSONSchema7Definition } from 'schema-type';

export const packedAuthSessionSchema = {
	$id: 'https://misskey-hub.net/api/schemas/AuthSession',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		app: { $ref: 'https://misskey-hub.net/api/schemas/App' },
		token: {
			type: 'string',
		},
	},
	required: [
		'id',
		'app',
		'token',
	],
} as const satisfies JSONSchema7Definition;
