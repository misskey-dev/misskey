import type { JSONSchema7Definition } from 'schema-type';

export const packedUserListSchema = {
	$id: 'https://misskey-hub.net/api/schemas/UserList',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		name: {
			type: 'string',
		},
		userIds: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		isPublic: {
			type: 'boolean',
		},
	},
	required: [
		'id',
		'createdAt',
		'name',
		'userIds',
		'isPublic',
	],
} as const satisfies JSONSchema7Definition;
