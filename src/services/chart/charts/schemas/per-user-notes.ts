import { types, bool } from '../../../../misc/schema';

export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		total: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '集計期間時点での、全投稿数'
		},

		inc: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '増加した投稿数'
		},

		dec: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '減少した投稿数'
		},

		diffs: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				normal: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '通常の投稿数の差分'
				},

				reply: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: 'リプライの投稿数の差分'
				},

				renote: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: 'Renoteの投稿数の差分'
				},
			}
		},
	}
};

export const name = 'perUserNotes';
