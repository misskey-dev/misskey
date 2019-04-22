import { types, bool } from '../../../../misc/schema';

/**
 * フェデレーションに関するチャート
 */
export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		instance: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				total: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: 'インスタンス数の合計'
				},
				inc: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加インスタンス数'
				},
				dec: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少インスタンス数'
				},
			}
		}
	}
};

export const name = 'federation';
