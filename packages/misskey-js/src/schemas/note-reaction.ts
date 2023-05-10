import type { JSONSchema7Definition } from 'schema-type';

export const packedNoteReactionSchema = {
	$id: 'https://misskey-hub.net/api/schemas/NoteReaction',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
		type: {
			type: 'string',
		},
	},
	required: [
		'id',
		'createdAt',
		'user',
		'type',
	],
} as const satisfies JSONSchema7Definition;
