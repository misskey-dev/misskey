import $ from 'cafy';
import ID, { transform, ObjectId } from '../../../../misc/cafy-id';
import { getRelation } from '../../../../models/user';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ユーザー間のリレーションを取得します。'
	},

	requireCredential: true,

	params: {
		userId: {
			validator: $.or($.type(ID), $.arr($.type(ID)).unique()),
			transform: (v: any): ObjectId | ObjectId[] => Array.isArray(v) ? v.map(x => transform(x)) : transform(v),
			desc: {
				'ja-JP': 'ユーザーID (配列でも可)'
			}
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

	const relations = await Promise.all(ids.map(id => getRelation(me._id, id)));

	res(Array.isArray(ps.userId) ? relations : relations[0]);
}));
