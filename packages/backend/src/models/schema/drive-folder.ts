export const packedDriveFolderSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		foldersCount: {
			type: 'number' as const,
			optional: true as const, nullable: false as const,
		},
		filesCount: {
			type: 'number' as const,
			optional: true as const, nullable: false as const,
		},
		parentId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		parent: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFolder' as const,
		},
	},
};
