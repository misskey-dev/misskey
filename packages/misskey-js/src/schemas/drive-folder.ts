import type { JSONSchema7Definition } from 'schema-type';

export const packedDriveFolderSchema = {
	$id: 'https://misskey-hub.net/api/schemas/DriveFolder',

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
		foldersCount: {
			type: 'number',
		},
		filesCount: {
			type: 'number',
		},
		parentId: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/Id',
			}, {
				type: 'null',
			}],
		},
		parent: {
			oneOf: [{
				$ref: 'https://misskey-hub.net/api/schemas/DriveFolder',
			}, {
				type: 'null',
			}],
		},
	},
	required: [
		'id',
		'createdAt',
		'name',
		'parentId',
	],
} as const satisfies JSONSchema7Definition;
