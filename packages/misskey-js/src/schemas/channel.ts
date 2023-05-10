import type { JSONSchema7Definition } from 'schema-type';

export const packedChannelSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Channel',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		lastNotedAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, {
				type: 'null',
			}],
		},
		name: {
			type: 'string',
		},
		description: {
			type: ['string', 'null'],
		},
		bannerUrl: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		isArchived: {
			type: 'boolean',
		},
		notesCount: {
			type: 'number',
		},
		usersCount: {
			type: 'number',
		},
		isFollowing: {
			type: 'boolean',
		},
		isFavorited: {
			type: 'boolean',
		},
		userId: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/Id',
			}, {
				type: 'null',
			}],
		},
		pinnedNoteIds: {
			type: 'array',
			items: {
				$ref: 'https://misskey-hub.net/api/schemas/Id',
			},
		},
		color: {
			type: 'string',
		},
	},
	required: [
		'id',
		'createdAt',
		'lastNotedAt',
		'name',
		'description',
		'bannerUrl',
		'isArchived',
		'notesCount',
		'usersCount',
		'userId',
		'pinnedNoteIds',
		'color',
	],
} as const satisfies JSONSchema7Definition;
