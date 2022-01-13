export const packedDriveFileSchema = {
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
			example: 'lenna.jpg',
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'image/jpeg',
		},
		md5: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'md5',
			example: '15eca7fba0480996e2245f5185bf39f2',
		},
		size: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			example: 51469,
		},
		isSensitive: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		blurhash: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		properties: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				width: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 1280,
				},
				height: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 720,
				},
				orientation: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 8,
				},
				avgColor: {
					type: 'string' as const,
					optional: true as const, nullable: false as const,
					example: 'rgb(40,65,87)',
				},
			},
		},
		url: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url',
		},
		thumbnailUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url',
		},
		comment: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		folderId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		folder: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFolder' as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'User' as const,
		},
	},
};
