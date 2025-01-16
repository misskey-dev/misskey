export const packedNoteDraftSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'misskey:id'
		},
		updatedAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time'
		},
		scheduledAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		reason: {
			type: 'string',
			optional: true, nullable: false
		},
		channel: {
			type: 'object',
			optional: true, nullable: true,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'misskey:id'
				},
				name: {
					type: 'string',
					optional: false, nullable: false
				},
			},
		},
		renote: {
			type: 'object',
			optional: true, nullable: true,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'misskey:id',
				},
				text: {
					type: 'string',
					optional: false, nullable: true,
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'misskey:id',
						},
						username: {
							type: 'string',
							optional: false, nullable: false,
						},
						host: {
							type: 'string',
							optional: false, nullable: true,
						},
					},
				},
			},
		},
		reply: {
			type: 'object',
			optional: true, nullable: true,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'misskey:id',
				},
				text: {
					type: 'string',
					optional: false, nullable: true,
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'misskey:id'
						},
						username: {
							type: 'string',
							optional: false, nullable: false,
						},
						host: {
							type: 'string',
							optional: false, nullable: true,
						},
					},
				},
			},
		},
		data: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				text: {
					type: 'string',
					optional: false, nullable: true,
				},
				useCw: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				cw: {
					type: 'string',
					optional: false, nullable: true,
				},
				visibility: {
					type: 'string',
					optional: false, nullable: false,
					enum: ['public', 'home', 'followers', 'specified'],
				},
				localOnly: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				files: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'DriveFile',
					},
				},
				poll: {
					type: 'object',
					optional: false, nullable: true,
					properties: {
						choices: {
							type: 'array',
							optional: false, nullable: false,
							items: {
								type: 'string',
								optional: false, nullable: false,
							},
						},
						multiple: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						expiresAt: {
							type: 'integer',
							optional: false, nullable: true,
						},
						expiredAfter: {
							type: 'integer',
							optional: false, nullable: true,
							minimum: 1
						},
					},
				},
				visibleUserIds: {
					type: 'array',
					optional: true, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
						format: 'misskey:id',
					},
				},
			},
		},
	},
} as const;
