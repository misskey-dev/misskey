import type { JSONSchema7Definition } from 'schema-type';

export const packedFollowingSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Following',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		followeeId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		followee: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
		followerId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		follower: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
	},
	required: [
		'id',
		'createdAt',
		'followeeId',
		'followerId',
	],
} as const satisfies JSONSchema7Definition;

export const packedFollowRequestSchema = {
	$id: 'https://misskey-hub.net/api/schemas/FollowRequest',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		followee: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
		follower: { $ref: 'https://misskey-hub.net/api/schemas/UserLite' },
	},
	required: [
		'id',
		'followee',
		'follower',
	],
} as const satisfies JSONSchema7Definition;
