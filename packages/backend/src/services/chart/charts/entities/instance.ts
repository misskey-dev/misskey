import Chart from '../../core';

export const name = 'instance';

export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		requests: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				failed: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				succeeded: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				received: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},

		notes: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},

				diffs: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						normal: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
						},

						reply: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
						},

						renote: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
						},
					},
				},
			},
		},

		users: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},

		following: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},

		followers: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},

		drive: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				totalFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				totalUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				incFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				incUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				decFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
				decUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
	},
};

export const entity = Chart.schemaToEntity(name, schema, true);
