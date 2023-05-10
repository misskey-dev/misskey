import type { JSONSchema7Definition } from 'schema-type';

export const packedNoteFavoriteSchema = {
	$id: 'https://misskey-hub.net/api/schemas/NoteFavorite',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		noteId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		note: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
	},
	required: [
		'id',
		'createdAt',
		'note',
		'noteId',
	]
} as const satisfies JSONSchema7Definition;
