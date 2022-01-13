export const packedMessagingMessageSchema = {
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
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: true as const, nullable: false as const,
		},
		text: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		fileId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
		},
		file: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFile' as const,
		},
		recipientId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		recipient: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'User' as const,
		},
		groupId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		group: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'UserGroup' as const,
		},
		isRead: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		reads: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
	},
};
