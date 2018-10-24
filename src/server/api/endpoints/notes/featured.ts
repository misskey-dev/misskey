import $ from 'cafy';
import Note from '../../../../models/note';
import { packMany } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'Featuredな投稿を取得します。',
		'en-US': 'Get featured notes.'
	},

	requireCredential: false,

	params: {
		limit: $.num.optional.range(1, 30).note({
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		})
	}
};

export default async (params: any, user: ILocalUser) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	const day = 1000 * 60 * 60 * 24;

	const notes = await Note
		.find({
			createdAt: {
				$gt: new Date(Date.now() - day)
			},
			deletedAt: null,
			visibility: { $in: ['public', 'home'] }
		}, {
			limit: ps.limit,
			sort: {
				score: -1
			},
			hint: {
				score: -1
			}
		});

	return await packMany(notes, user);
};
