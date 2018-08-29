import $ from 'cafy';
import Meta from '../../../../models/meta';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの設定を更新します。'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		disableRegistration: $.bool.optional.nullable.note({
			desc: {
				'ja-JP': '招待制か否か'
			}
		}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const set = {} as any;

	if (ps.disableRegistration === true || ps.disableRegistration === false) {
		set.disableRegistration = ps.disableRegistration;
	}

	await Meta.update({}, {
		$set: set
	}, { upsert: true });

	res();
});
