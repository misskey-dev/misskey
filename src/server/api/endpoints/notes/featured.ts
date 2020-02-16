import $ from 'cafy';
import define from '../../define';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { Notes } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'Featuredな投稿を取得します。',
		'en-US': 'Get featured notes.'
	},

	tags: ['notes'],

	requireCredential: false as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},
};

export default define(meta, async (ps, user) => {
	const max = 30;
	const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

	const query = Notes.createQueryBuilder('note')
		.addSelect('note.score')
		.where('note.userHost IS NULL')
		.andWhere(`note.createdAt > :date`, { date: new Date(Date.now() - day) })
		.andWhere(`note.visibility = 'public'`)
		.leftJoinAndSelect('note.user', 'user');

	if (user) generateMuteQuery(query, user);

	let notes = await query
		.orderBy('note.score', 'DESC')
		.take(max)
		.getMany();

	notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	notes = notes.slice(ps.offset, ps.offset + ps.limit);

	return await Notes.packMany(notes, user);
});
