import Note from '../../../../models/note';

/*
トレンドに載るためには「『直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上』のハッシュタグの上位5位以内に入る」ことが必要
ユニーク投稿数とはそのハッシュタグと投稿ユーザーのペアのカウントで、例えば同じユーザーが複数回同じハッシュタグを投稿してもそのハッシュタグのユニーク投稿数は1とカウントされる
*/

const rangeA = 1000 * 60 * 10; // 10分
const rangeB = 1000 * 60 * 40; // 40分
const coefficient = 1.5; // 「n倍」の部分

/**
 * Get trends of hashtags
 */
module.exports = () => new Promise(async (res, rej) => {
	//#region 1. 直近Aの内に投稿されたハッシュタグ(とユーザーのペア)を集計
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - rangeA)
			},
			tags: {
				$exists: true,
				$ne: []
			}
		}
	}, {
		$unwind: '$tags'
	}, {
		$group: {
			_id: { tags: '$tags', userId: '$userId' }
		}
	}]) as Array<{
		_id: {
			tags: string;
			userId: any;
		}
	}>;
	//#endregion

	if (data.length == 0) {
		return res([]);
	}

	const tags = [];

	// カウント
	data.map(x => x._id).forEach(x => {
		const i = tags.findIndex(tag => tag.name == x.tags);
		if (i != -1) {
			tags[i].count++;
		} else {
			tags.push({
				name: x.tags,
				count: 1
			});
		}
	});

	//#region 2. 1で取得したそれぞれのタグについて、「直近a分間のユニーク投稿数が今からa分前～今からb分前の間のユニーク投稿数のn倍以上」かどうかを判定する
	const hotsPromises = tags.map(async tag => {
		const passedCount = (await Note.distinct('userId', {
			tags: tag.name,
			createdAt: {
				$lt: new Date(Date.now() - rangeA),
				$gt: new Date(Date.now() - rangeB)
			}
		}) as any).length;

		if (tag.count > (passedCount * coefficient)) {
			return tag;
		} else {
			return null;
		}
	});
	//#endregion

	const hots = (await Promise.all(hotsPromises))
		.filter(x => x != null)
		.sort((a, b) => b.count - a.count)
		.map(tag => tag.name)
		.slice(0, 5);

	//#region 2で話題と判定されたタグそれぞれについて過去の投稿数グラフを取得する
	const countPromises: Array<Promise<any[]>> = [];

	const range = 20;

	// 10分
	const interval = 1000 * 60 * 10;

	for (let i = 0; i < range; i++) {
		countPromises.push(Promise.all(hots.map(tag => Note.distinct('userId', {
			tags: tag,
			createdAt: {
				$lt: new Date(Date.now() - (interval * i)),
				$gt: new Date(Date.now() - (interval * (i + 1)))
			}
		}))));
	}

	const countsLog = await Promise.all(countPromises);

	const totalCounts: any = await Promise.all(hots.map(tag => Note.distinct('userId', {
		tags: tag,
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

	res(stats);
});
