import type { JSONSchema7Definition } from 'schema-type';

export const packedEmojiSimpleSchema = {
	$id: 'https://misskey-hub.net/api/schemas/EmojiSimple',

	type: 'object',
	properties: {
		aliases: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		},
		name: {
			type: 'string',
		},
		category: {
			type: ['string', 'null'],
		},
		url: {
			type: 'string',
		},
		isSensitive: {
			type: 'boolean',
		},
		roleIdsThatCanBeUsedThisEmojiAsReaction: {
			type: 'array',
			items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		}
	},
	required: [
		'aliases',
		'name',
		'category',
		'url',
	],
} as const satisfies JSONSchema7Definition;

export const packedEmojiDetailedSchema = {
	$id: 'https://misskey-hub.net/api/schemas/EmojiDetailed',

	type: 'object',
	allOf: [{
		$ref: 'https://misskey-hub.net/api/schemas/EmojiSimple',
	}, {
		type: 'object',
		properties: {
			isSensitive: {
				type: 'boolean',
			},
			roleIdsThatCanBeUsedThisEmojiAsReaction: {
				type: 'array',
				items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
			},
			id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
			host: {
				type: ['string', 'null'],
				description: 'The local host is represented with `null`.',
			},
			license: {
				type: ['string', 'null'],
			},
			localOnly: {
				type: 'boolean',
			},
		},
		required: [
			'isSensitive',
			'roleIdsThatCanBeUsedThisEmojiAsReaction',
			'id',
			'host',
			'license',
			'localOnly',
		],
	}],
} as const satisfies JSONSchema7Definition;
