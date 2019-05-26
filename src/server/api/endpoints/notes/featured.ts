import $ from 'cafy';
import define from '../../define';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { Notes } from '../../../../models';
import { types, bool } from '../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': 'Featuredな投稿を取得します。',
		'en-US': 'Get featured notes.'
	},

	tags: ['notes'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 30),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		}
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'Note',
		}
	},
};

export default define(meta, async (ps, user) => {
	const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

	const query = Notes.createQueryBuilder('note')
		.addSelect('note.score')
		.where('note.userHost IS NULL')
		.andWhere(`note.createdAt > :date`, { date: new Date(Date.now() - day) })
		.andWhere(`note.visibility = 'public'`)
		.leftJoinAndSelect('note.user', 'user');

	if (user) generateMuteQuery(query, user);

	const notes = await query.orderBy('note.score', 'DESC').take(ps.limit!).getMany();

	return await Notes.packMany(notes, user);
});
