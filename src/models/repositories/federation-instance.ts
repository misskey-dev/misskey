import config from '@/config';

export const packedFederationInstanceSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id'
		},
		caughtAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time'
		},
		host: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'misskey.example.com'
		},
		usersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		notesCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		followingCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		followersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		driveUsage: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		driveFiles: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		latestRequestSentAt: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'date-time'
		},
		lastCommunicatedAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time'
		},
		isNotResponding: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const
		},
		isSuspended: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const
		},
		softwareName: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			example: 'misskey'
		},
		softwareVersion: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			example: config.version
		},
		openRegistrations: {
			type: 'boolean' as const,
			optional: false as const, nullable: true as const,
			example: true
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		description: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		maintainerName: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		maintainerEmail: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		iconUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url'
		},
		infoUpdatedAt: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'date-time'
		}
	}
};
