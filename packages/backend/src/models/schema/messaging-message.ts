export const packedMessagingMessageSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: true, nullable: false,
		},
		text: {
			type: 'string',
			optional: false, nullable: true,
		},
		fileId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
		},
		file: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'DriveFile',
		},
		recipientId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		recipient: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'UserLite',
		},
		groupId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		group: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'UserGroup',
		},
		isRead: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		reads: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;
