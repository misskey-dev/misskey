import type { JSONSchema7Definition } from 'schema-type';

export const packedRelaySchema = {
	$id: 'https://misskey-hub.net/api/schemas/Relay',

	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'id',
		},
		inbox: {
			type: 'string',
			format: 'url',
		},
		status: {
			type: 'string',
			default: 'requesting',
			enum: [
				'requesting',
				'accepted',
				'rejected',
			],
		},
	},
	required: [
		'id',
		'inbox',
		'status'
	],
} as const satisfies JSONSchema7Definition;
