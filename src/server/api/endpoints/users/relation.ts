import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import { ILocalUser, getRelation } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ユーザー間のリレーションを取得します。'
	},

	requireCredential: true,

	params: {
		userId: $.or($.type(ID), $.arr($.type(ID)).unique()).note({
			desc: {
				'ja-JP': 'ユーザーID (配列でも可)'
			}
		})
	}
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

	const relations = await Promise.all(ids.map(id => getRelation(me._id, id)));

	res(Array.isArray(ps.userId) ? relations : relations[0]);
});
