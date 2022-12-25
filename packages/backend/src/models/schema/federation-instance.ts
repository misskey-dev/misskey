export const packedFederationInstanceSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		caughtAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		host: {
			type: 'string',
			optional: false, nullable: false,
			example: 'misskey.example.com',
		},
		usersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		notesCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		followingCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		followersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		latestRequestSentAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		lastCommunicatedAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		isNotResponding: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isSuspended: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isBlocked: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		softwareName: {
			type: 'string',
			optional: false, nullable: true,
			example: 'misskey',
		},
		softwareVersion: {
			type: 'string',
			optional: false, nullable: true,
		},
		openRegistrations: {
			type: 'boolean',
			optional: false, nullable: true,
			example: true,
		},
		name: {
			type: 'string',
			optional: false, nullable: true,
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		maintainerName: {
			type: 'string',
			optional: false, nullable: true,
		},
		maintainerEmail: {
			type: 'string',
			optional: false, nullable: true,
		},
		iconUrl: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		faviconUrl: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		themeColor: {
			type: 'string',
			optional: false, nullable: true,
		},
		infoUpdatedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
	},
} as const;
