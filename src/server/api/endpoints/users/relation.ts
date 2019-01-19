import $ from 'cafy'; import ID, { transform, ObjectId } from '../../../../misc/cafy-id';
import { getRelation } from '../../../../models/user';
import define from '../../define';
import { arrayOf, map } from '../../../../prelude/arrayable';

export const meta = {
	desc: {
		'ja-JP': 'ユーザー間のリレーションを取得します。'
	},

	requireCredential: true,

	params: {
		userId: {
			validator: $.or($.type(ID), $.arr($.type(ID)).unique()),
			transform(x: any): ObjectId | ObjectId[] {
				return map(x, transform);
			},
			desc: {
				'ja-JP': 'ユーザーID (配列でも可)'
			}
		}
	}
};

export default define(meta, (ps, me) => Promise.all(arrayOf(ps.userId).map(id => getRelation(me._id, id)))
	.then(x => Array.isArray(ps.userId) ? x : x[0]));
