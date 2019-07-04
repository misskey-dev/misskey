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
					description: 'インスタンス数の合計'
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加インスタンス数'
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少インスタンス数'
				},
			}
		}
	}
};

export const name = 'federation';
