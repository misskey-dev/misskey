import type { JSONSchema7Definition } from 'schema-type';

export const packedFederationInstanceSchema = {
	$id: 'https://misskey-hub.net/api/schemas/FederationInstance',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		firstRetrievedAt: {
			type: 'string',
			format: 'date-time',
		},
		host: {
			type: 'string',
			examples: 'misskey.example.com',
		},
		usersCount: {
			type: 'number',
		},
		notesCount: {
			type: 'number',
		},
		followingCount: {
			type: 'number',
		},
		followersCount: {
			type: 'number',
		},
		isNotResponding: {
			type: 'boolean',
		},
		isSuspended: {
			type: 'boolean',
		},
		isBlocked: {
			type: 'boolean',
		},
		softwareName: {
			type: ['string', 'null'],
			examples: 'misskey',
		},
		softwareVersion: {
			type: ['string', 'null'],
		},
		openRegistrations: {
			type: ['boolean', 'null'],
			examples: true,
		},
		name: {
			type: ['string', 'null'],
		},
		description: {
			type: ['string', 'null'],
		},
		maintainerName: {
			type: ['string', 'null'],
		},
		maintainerEmail: {
			type: ['string', 'null'],
		},
		iconUrl: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		faviconUrl: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		themeColor: {
			type: ['string', 'null'],
		},
		infoUpdatedAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, {
				type: 'null',
			}],
		},
	},
	required: [
		'id',
		'firstRetrievedAt',
		'host',
		'usersCount',
		'notesCount',
		'followingCount',
		'followersCount',
		'isNotResponding',
		'isSuspended',
		'isBlocked',
		'softwareName',
		'softwareVersion',
		'openRegistrations',
		'name',
		'description',
		'maintainerName',
		'maintainerEmail',
		'iconUrl',
		'faviconUrl',
		'themeColor',
		'infoUpdatedAt',
	],
} as const satisfies JSONSchema7Definition;
