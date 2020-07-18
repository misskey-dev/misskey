import $ from 'cafy';
import define from '../../define';
import { ID } from '../../../../misc/cafy-id';
import { Users } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ユーザー間のリレーションを取得します。'
	},

	tags: ['users'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.either($.type(ID), $.arr($.type(ID)).unique()),
			desc: {
				'ja-JP': 'ユーザーID (配列でも可)'
			}
		}
	}
};

export default define(meta, async (ps, me) => {
	const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

	const relations = await Promise.all(ids.map(id => Users.getRelation(me.id, id)));

	return Array.isArray(ps.userId) ? relations : relations[0];
});
