import type { JSONSchema7Definition } from 'schema-type';

export const packedHashtagSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Hashtag',

	type: 'object',
	properties: {
		tag: {
			type: 'string',
			examples: 'misskey',
		},
		mentionedUsersCount: {
			type: 'number',
		},
		mentionedLocalUsersCount: {
			type: 'number',
		},
		mentionedRemoteUsersCount: {
			type: 'number',
		},
		attachedUsersCount: {
			type: 'number',
		},
		attachedLocalUsersCount: {
			type: 'number',
		},
		attachedRemoteUsersCount: {
			type: 'number',
		},
	},
	required: [
		'tag',
		'mentionedUsersCount',
		'mentionedLocalUsersCount',
		'mentionedRemoteUsersCount',
		'attachedUsersCount',
		'attachedLocalUsersCount',
		'attachedRemoteUsersCount',
	],
} as const satisfies JSONSchema7Definition;
