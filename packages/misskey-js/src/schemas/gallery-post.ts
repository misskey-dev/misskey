import type { JSONSchema7Definition } from 'schema-type';

export const packedGalleryPostSchema = {
	$id: 'https://misskey-hub.net/api/schemas/GalleryPost',

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
		description: {
			type: ['string', 'null'],
		},
		userId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
		fileIds: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		files: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/DriveFile' },
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		isSensitive: {
			type: 'boolean',
		},
	},
	required: [
		'id',
		'createdAt',
		'updatedAt',
		'title',
		'description',
		'userId',
		'user',
		'isSensitive',
	],
} as const satisfies JSONSchema7Definition;
