import type { JSONSchema7Definition } from 'schema-type';

export const packedDriveFileSchema = {
	$id: 'https://misskey-hub.net/api/schemas/DriveFile',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		name: {
			type: 'string',
			examples: 'lenna.jpg',
		},
		type: {
			type: 'string',
			examples: 'image/jpeg',
		},
		md5: {
			type: 'string',
			format: 'md5',
			examples: '15eca7fba0480996e2245f5185bf39f2',
		},
		size: {
			type: 'number',
			examples: 51469,
		},
		isSensitive: {
			type: 'boolean',
		},
		blurhash: {
			type: ['string', 'null'],
		},
		properties: {
			type: 'object',
			properties: {
				width: {
					type: 'number',
					examples: 1280,
				},
				height: {
					type: 'number',
					examples: 720,
				},
				orientation: {
					type: 'number',
					examples: 8,
				},
				avgColor: {
					type: 'string',
					examples: 'rgb(40,65,87)',
				},
			},
			required: [],
		},
		url: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		thumbnailUrl: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		comment: {
			type: ['string', 'null'],
		},
		folderId: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/Id',
			}, {
				type: 'null',
			}],
		},
		folder: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
			}, {
				type: 'null',
			}],
		},
		userId: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/Id',
			}, {
				type: 'null',
			}],
		},
		user: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/UserLite',
			}, {
				type: 'null',
			}],
		},
	},
	required: [
		'id',
		'createdAt',
		'name',
		'type',
		'md5',
		'size',
		'isSensitive',
		'blurhash',
		'properties',
		'url',
		'thumbnailUrl',
		'comment',
		'folderId',
		'userId',
	],
} as const satisfies JSONSchema7Definition;
