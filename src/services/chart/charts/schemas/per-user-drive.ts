import { types, bool } from '../../../../misc/schema';

export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		/**
		 * 集計期間時点での、全ドライブファイル数
		 */
		totalCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '集計期間時点での、全ドライブファイル数'
		},

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ
		 */
		totalSize: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '集計期間時点での、全ドライブファイルの合計サイズ'
		},

		/**
		 * 増加したドライブファイル数
		 */
		incCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '増加したドライブファイル数'
		},

		/**
		 * 増加したドライブ使用量
		 */
		incSize: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '増加したドライブ使用量'
		},

		/**
		 * 減少したドライブファイル数
		 */
		decCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '減少したドライブファイル数'
		},

		/**
		 * 減少したドライブ使用量
		 */
		decSize: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '減少したドライブ使用量'
		},
	}
};

export const name = 'perUserDrive';
