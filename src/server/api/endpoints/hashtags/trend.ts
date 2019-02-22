import Note from '../../../../models/note';
import { erase } from '../../../../prelude/array';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

/*
トレンドに載るためには「『直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上』のハッシュタグの上位5位以内に入る」ことが必要
ユニーク投稿数とはそのハッシュタグと投稿ユーザーのペアのカウントで、例えば同じユーザーが複数回同じハッシュタグを投稿してもそのハッシュタグのユニーク投稿数は1とカウントされる
*/

const rangeA = 1000 * 60 * 30; // 30分
const rangeB = 1000 * 60 * 120; // 2時間
const coefficient = 1.25; // 「n倍」の部分
const requiredUsers = 3; // 最低何人がそのタグを投稿している必要があるか

const max = 5;

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
};

export default define(meta, async () => {
	const instance = await fetchMeta();
	const hidedTags = instance.hidedTags.map(t => t.toLowerCase());

	//#region 1. 直近Aの内に投稿されたハッシュタグ(とユーザーのペア)を集計
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - rangeA)
			},
			tagsLower: {
				$exists: true,
				$ne: []
			}
		}
	}, {
		$unwind: '$tagsLower'
	}, {
		$group: {
			_id: { tag: '$tagsLower', userId: '$userId' }
		}
	}]) as {
		_id: {
			tag: string;
			userId: any;
		}
	}[];
	//#endregion

	if (data.length == 0) {
		return [];
	}

	const tags: {
		name: string;
		count: number;
	}[] = [];

	// カウント
	for (const x of data.map(x => x._id).filter(x => !hidedTags.includes(x.tag))) {
		const i = tags.findIndex(tag => tag.name == x.tag);
		if (i != -1) {
			tags[i].count++;
		} else {
			tags.push({
				name: x.tag,
				count: 1
			});
		}
	}

	// 最低要求投稿者数を下回るならカットする
	const limitedTags = tags.filter(tag => tag.count >= requiredUsers);

	//#region 2. 1で取得したそれぞれのタグについて、「直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上」かどうかを判定する
	const hotsPromises = limitedTags.map(async tag => {
		const passedCount = (await Note.distinct('userId', {
			tagsLower: tag.name,
			createdAt: {
				$lt: new Date(Date.now() - rangeA),
				$gt: new Date(Date.now() - rangeB)
			}
		}) as any).length;

		if (tag.count >= (passedCount * coefficient)) {
			return tag;
		} else {
			return null;
		}
	});
	//#endregion

	// タグを人気順に並べ替え
	let hots = erase(null, await Promise.all(hotsPromises))
		.sort((a, b) => b.count - a.count)
		.map(tag => tag.name)
		.slice(0, max);

	//#region 3. もし上記の方法でのトレンド抽出の結果、求められているタグ数に達しなければ「ただ単に現在投稿数が多いハッシュタグ」に切り替える
	if (hots.length < max) {
		hots = hots.concat(tags
			.filter(tag => hots.indexOf(tag.name) == -1)
			.sort((a, b) => b.count - a.count)
			.map(tag => tag.name)
			.slice(0, max - hots.length));
	}
	//#endregion

	//#region 2(または3)で話題と判定されたタグそれぞれについて過去の投稿数グラフを取得する
	const countPromises: Promise<any[]>[] = [];

	const range = 20;

	// 10分
	const interval = 1000 * 60 * 10;

	for (let i = 0; i < range; i++) {
		countPromises.push(Promise.all(hots.map(tag => Note.distinct('userId', {
			tagsLower: tag,
			createdAt: {
				$lt: new Date(Date.now() - (interval * i)),
				$gt: new Date(Date.now() - (interval * (i + 1)))
			}
		}))));
	}

	const countsLog = await Promise.all(countPromises);

	const totalCounts: any = await Promise.all(hots.map(tag => Note.distinct('userId', {
		tagsLower: tag,
		createdAt: {
			$gt: new Date(Date.now() - (interval * range))
		}
	})));
	//#endregion

	const stats = hots.map((tag, i) => ({
		tag,
		chart: countsLog.map(counts => counts[i].length),
		usersCount: totalCounts[i].length
	}));

	return stats;
});
