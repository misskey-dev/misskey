
export const schemas = {
	Error: {
		type: 'object',
		properties: {
			error: {
				type: 'object',
				description: 'An error object.',
				properties: {
					code: {
						type: 'string',
						description: 'An error code. Unique within the endpoint.',
					},
					message: {
						type: 'string',
						description: 'An error message.',
					},
					id: {
						type: 'string',
						format: 'uuid',
						description: 'An error ID. This ID is static.',
					}
				},
				required: ['code', 'id', 'message']
			},
		},
		required: ['error']
	},

	User: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this User.'
			},
			username: {
				type: 'string',
				description: 'The screen name, handle, or alias that this user identifies themselves with.',
				example: 'ai'
			},
			name: {
				type: 'string',
				nullable: true,
				description: 'The name of the user, as they’ve defined it.',
				example: '藍'
			},
			host: {
				type: 'string',
				nullable: true,
				example: 'misskey.example.com'
			},
			description: {
				type: 'string',
				nullable: true,
				description: 'The user-defined UTF-8 string describing their account.',
				example: 'Hi masters, I am Ai!'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the user account was created on Misskey.'
			},
			followersCount: {
				type: 'number',
				description: 'The number of followers this account currently has.'
			},
			followingCount: {
				type: 'number',
				description: 'The number of users this account is following.'
			},
			notesCount: {
				type: 'number',
				description: 'The number of Notes (including renotes) issued by the user.'
			},
			isBot: {
				type: 'boolean',
				description: 'Whether this account is a bot.'
			},
			isCat: {
				type: 'boolean',
				description: 'Whether this account is a cat.'
			},
			isAdmin: {
				type: 'boolean',
				description: 'Whether this account is the admin.'
			},
			isVerified: {
				type: 'boolean'
			},
			isLocked: {
				type: 'boolean'
			},
		},
		required: ['id', 'name', 'username', 'createdAt']
	},

	Note: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Note.'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the Note was created on Misskey.'
			},
			text: {
				type: 'string'
			},
			cw: {
				type: 'string'
			},
			userId: {
				type: 'string',
				format: 'id',
			},
			user: {
				$ref: '#/components/schemas/User'
			},
			replyId: {
				type: 'string',
				format: 'id',
			},
			renoteId: {
				type: 'string',
				format: 'id',
			},
			reply: {
				$ref: '#/components/schemas/Note'
			},
			renote: {
				$ref: '#/components/schemas/Note'
			},
			viaMobile: {
				type: 'boolean'
			},
			visibility: {
				type: 'string'
			},
		},
		required: ['id', 'userId', 'createdAt']
	},

	DriveFile: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
				description: 'The unique identifier for this Drive file.'
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'The date that the Drive file was created on Misskey.'
			},
			name: {
				type: 'string',
				description: 'The file name with extension.',
				example: 'lenna.jpg'
			},
			type: {
				type: 'string',
				description: 'The MIME type of this Drive file.',
				example: 'image/jpeg'
			},
			md5: {
				type: 'string',
				format: 'md5',
				description: 'The MD5 hash of this Drive file.',
				example: '15eca7fba0480996e2245f5185bf39f2'
			},
			datasize: {
				type: 'number',
				description: 'The size of this Drive file. (bytes)',
				example: 51469
			},
			folderId: {
				type: 'string',
				format: 'id',
				nullable: true,
				description: 'The parent folder ID of this Drive file.',
			},
			isSensitive: {
				type: 'boolean',
				description: 'Whether this Drive file is sensitive.',
			},
		},
		required: ['id', 'createdAt', 'name', 'type', 'datasize', 'md5']
	}
};
