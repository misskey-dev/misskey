/**
 * フェデレーションに関するチャート
 */
export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		instance: {
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
			}
		}
	}
};

export const name = 'federation';
