export const packedNoteSchema = {
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
		deletedAt: {
			type: 'string',
			optional: true, nullable: true,
			format: 'date-time',
		},
		text: {
			type: 'string',
			optional: false, nullable: true,
		},
		cw: {
			type: 'string',
			optional: true, nullable: true,
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: false, nullable: false,
		},
		replyId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		renoteId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		reply: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'Note',
		},
		renote: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'Note',
		},
		isHidden: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		visibility: {
			type: 'string',
			optional: false, nullable: false,
		},
		mentions: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		visibleUserIds: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		fileIds: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		files: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFile',
			},
		},
		tags: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		poll: {
			type: 'object',
			optional: true, nullable: true,
		},
		channelId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		channel: {
			type: 'object',
			optional: true, nullable: true,
			items: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					id: {
						type: 'string',
						optional: false, nullable: false,
					},
					name: {
						type: 'string',
						optional: false, nullable: true,
					},
				},
			},
		},
		localOnly: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		emojis: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					name: {
						type: 'string',
						optional: false, nullable: false,
					},
					url: {
						type: 'string',
						optional: false, nullable: true,
					},
				},
			},
		},
		reactions: {
			type: 'object',
			optional: false, nullable: false,
		},
		renoteCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		repliesCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		uri: {
			type: 'string',
			optional: true, nullable: false,
		},
		url: {
			type: 'string',
			optional: true, nullable: false,
		},

		myReaction: {
			type: 'object',
			optional: true, nullable: true,
		},
	},
} as const;
