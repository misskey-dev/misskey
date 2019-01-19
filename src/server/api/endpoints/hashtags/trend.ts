import Note from '../../../../models/note';
import { erase } from '../../../../prelude/array';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import { ObjectID } from 'mongodb';

/*
トレンドに載るためには「『直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上』のハッシュタグの上位5位以内に入る」ことが必要
ユニーク投稿数とはそのハッシュタグと投稿ユーザーのペアのカウントで、例えば同じユーザーが複数回同じハッシュタグを投稿してもそのハッシュタグのユニーク投稿数は1とカウントされる
*/

const rangeA = 1000 * 60 * 30; // 30分
const rangeB = 1000 * 60 * 120; // 2時間
const coefficient = 1.25; // 「n倍」の部分
const requiredUsers = 3; // 最低何人がそのタグを投稿している必要があるか

const max = 5;
const range = 20;
const interval = 1000 * 60 * 10;

export const meta = {
	requireCredential: false,
};

type Tags = [string, number][];

const fetchTags = (data: {
	_id: {
		tag: string,
		userId: ObjectID
	}
}[], ignores: string[]) => Object.entries(data
	.map(x => x._id)
	.filter(x => !ignores.includes(x.tag))
	.reduce((a, c) => {
		a[c.tag] = ++a[c.tag] || 1;
		return a;
	}, {} as { [name: string]: number }));

const aggregateFineTags = (tags: Tags) => Promise.all(tags
		.filter(([, x]) => x >= requiredUsers)
		.map(x => (Note.distinct('userId', {
				tagsLower: x[0],
				createdAt: {
					$lt: new Date(Date.now() - rangeA),
					$gt: new Date(Date.now() - rangeB)
				}
			}) as Promise<any>).then(({ length }) => x[1] >= length * coefficient ? x : null)))
	.then(x => erase(null, x)
		.sort(([, a], [, b]) => b - a)
		.slice(0, max)
		.map(([x]) => x));

const aggregateAllTags = (tags: Tags, fineTags: string[]) => fineTags.concat(tags
	.filter(([x]) => !fineTags.includes(x))
	.sort(([, a], [, b]) => b - a)
	.slice(0, max - fineTags.length)
	.map(([x]) => x));

const aggregateLogs = (tags: string[]) => Promise.all([...Array(range).keys()]
	.map(x => Promise.all(tags.map(tagsLower => Note.distinct('userId', {
		tagsLower,
		createdAt: {
			$lt: new Date(Date.now() - (interval * x)),
			$gt: new Date(Date.now() - (interval * (x + 1)))
		}
	}) as any))));

const countTotal = (tags: string[]) => Promise.all(tags.map(tagsLower => Note.distinct('userId', {
		tagsLower,
		createdAt: {
			$gt: new Date(Date.now() - (interval * range))
		}
	}) as any));

export default define(meta, () => fetchMeta()
	.then(instance => Note.aggregate([{
			$match: {
				createdAt: { $gt: new Date(Date.now() - rangeA) },
				tagsLower: {
					$exists: true,
					$ne: []
				}
			}
		}, { $unwind: '$tagsLower' }, {
			$group: {
				_id: {
					tag: '$tagsLower',
					userId: '$userId'
				}
			}
		}])
		.then(async x => {
			const tags = fetchTags(x, instance.hidedTags.map(x => x.toLowerCase()));
			const fine = await aggregateFineTags(tags);
			const hots = fine.length < max ? aggregateAllTags(tags, fine) : fine;
			const logs = await aggregateLogs(hots);
			const total = await countTotal(hots);
			return hots.map((tag, i) => ({
				tag,
				chart: logs.map(x => x[i].length),
				usersCount: total[i].length
			}));
		})));
