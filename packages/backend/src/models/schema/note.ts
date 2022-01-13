export const packedNoteSchema = {
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
		text: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		cw: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: false as const, nullable: false as const,
		},
		replyId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		renoteId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		reply: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Note' as const,
		},
		renote: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'Note' as const,
		},
		isHidden: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		visibility: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		mentions: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		visibleUserIds: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		fileIds: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		files: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'DriveFile' as const,
			},
		},
		tags: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
		poll: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
		channelId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		channel: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					id: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
					name: {
						type: 'string' as const,
						optional: false as const, nullable: true as const,
					},
				},
			},
		},
		localOnly: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		emojis: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					name: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
					url: {
						type: 'string' as const,
						optional: false as const, nullable: true as const,
					},
				},
			},
		},
		reactions: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
		},
		renoteCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		repliesCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		uri: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},
		url: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},

		myReaction: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
	},
};
