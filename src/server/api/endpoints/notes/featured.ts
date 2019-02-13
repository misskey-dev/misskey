import $ from 'cafy';
import Note from '../../../../models/note';
import { packMany } from '../../../../models/note';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'Featuredな投稿を取得します。',
		'en-US': 'Get featured notes.'
	},

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 30),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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

	res(await packMany(notes, user));
}));
