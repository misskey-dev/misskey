import { Brackets } from 'typeorm';
import define from '../../define';
import { fetchMeta } from '@/misc/fetch-meta';
import { Notes } from '../../../../models';
import { Note } from '../../../../models/entities/note';
import { safeForSql } from '@/misc/safe-for-sql';
import { normalizeForSearch } from '@/misc/normalize-for-search';

/*
トレンドに載るためには「『直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上』のハッシュタグの上位5位以内に入る」ことが必要
ユニーク投稿数とはそのハッシュタグと投稿ユーザーのペアのカウントで、例えば同じユーザーが複数回同じハッシュタグを投稿してもそのハッシュタグのユニーク投稿数は1とカウントされる

..が理想だけどPostgreSQLでどうするのか分からないので単に「直近Aの内に投稿されたユニーク投稿数が多いハッシュタグ」で妥協する
*/

const rangeA = 1000 * 60 * 60; // 60分
//const rangeB = 1000 * 60 * 120; // 2時間
//const coefficient = 1.25; // 「n倍」の部分
//const requiredUsers = 3; // 最低何人がそのタグを投稿している必要があるか

const max = 5;

export const meta = {
	tags: ['hashtags'],

	requireCredential: false as const,

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				tag: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				chart: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
					}
				},
				usersCount: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				}
			}
		}
	}
};

export default define(meta, async () => {
	const instance = await fetchMeta(true);
	const hiddenTags = instance.hiddenTags.map(t => normalizeForSearch(t));

	const now = new Date(); // 5分単位で丸めた現在日時
	now.setMinutes(Math.round(now.getMinutes() / 5) * 5, 0, 0);

	const tagNotes = await Notes.createQueryBuilder('note')
		.where(`note.createdAt > :date`, { date: new Date(now.getTime() - rangeA) })
		.andWhere(new Brackets(qb => { qb
			.where(`note.visibility = 'public'`)
			.orWhere(`note.visibility = 'home'`);
		}))
		.andWhere(`note.tags != '{}'`)
		.select(['note.tags', 'note.userId'])
		.cache(60000) // 1 min
		.getMany();

	if (tagNotes.length === 0) {
		return [];
	}

	const tags: {
		name: string;
		users: Note['userId'][];
	}[] = [];

	for (const note of tagNotes) {
		for (const tag of note.tags) {
			if (hiddenTags.includes(tag)) continue;

			const x = tags.find(x => x.name === tag);
			if (x) {
				if (!x.users.includes(note.userId)) {
					x.users.push(note.userId);
				}
			} else {
				tags.push({
					name: tag,
					users: [note.userId]
				});
			}
		}
	}

	// タグを人気順に並べ替え
	const hots = tags
		.sort((a, b) => b.users.length - a.users.length)
		.map(tag => tag.name)
		.slice(0, max);

	//#region 2(または3)で話題と判定されたタグそれぞれについて過去の投稿数グラフを取得する
	const countPromises: Promise<number[]>[] = [];

	const range = 20;

	// 10分
	const interval = 1000 * 60 * 10;

	for (let i = 0; i < range; i++) {
		countPromises.push(Promise.all(hots.map(tag => Notes.createQueryBuilder('note')
			.select('count(distinct note.userId)')
			.where(`'{"${safeForSql(tag) ? tag : 'aichan_kawaii'}"}' <@ note.tags`)
			.andWhere('note.createdAt < :lt', { lt: new Date(now.getTime() - (interval * i)) })
			.andWhere('note.createdAt > :gt', { gt: new Date(now.getTime() - (interval * (i + 1))) })
			.cache(60000) // 1 min
			.getRawOne()
			.then(x => parseInt(x.count, 10))
		)));
	}

	const countsLog = await Promise.all(countPromises);
	//#endregion

	const totalCounts = await Promise.all(hots.map(tag => Notes.createQueryBuilder('note')
		.select('count(distinct note.userId)')
		.where(`'{"${safeForSql(tag) ? tag : 'aichan_kawaii'}"}' <@ note.tags`)
		.andWhere('note.createdAt > :gt', { gt: new Date(now.getTime() - rangeA) })
		.cache(60000 * 60) // 60 min
		.getRawOne()
		.then(x => parseInt(x.count, 10))
	));

	const stats = hots.map((tag, i) => ({
		tag,
		chart: countsLog.map(counts => counts[i]),
		usersCount: totalCounts[i]
	}));

	return stats;
});
