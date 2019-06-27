export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		/**
		 * 集計期間時点での、全ドライブファイル数
		 */
		totalCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '集計期間時点での、全ドライブファイル数'
		},

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ
		 */
		totalSize: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '集計期間時点での、全ドライブファイルの合計サイズ'
		},

		/**
		 * 増加したドライブファイル数
		 */
		incCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '増加したドライブファイル数'
		},

		/**
		 * 増加したドライブ使用量
		 */
		incSize: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '増加したドライブ使用量'
		},

		/**
		 * 減少したドライブファイル数
		 */
		decCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '減少したドライブファイル数'
		},

		/**
		 * 減少したドライブ使用量
		 */
		decSize: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '減少したドライブ使用量'
		},
	}
};

export const name = 'perUserDrive';
