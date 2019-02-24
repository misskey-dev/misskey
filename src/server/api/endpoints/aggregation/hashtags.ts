import Note from '../../../../models/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
};

export default define(meta, async (ps) => {
	const instance = await fetchMeta();
	const hidedTags = instance.hidedTags.map(t => t.toLowerCase());

	// 重い
	//const span = 1000 * 60 * 60 * 24 * 7; // 1週間
	const span = 1000 * 60 * 60 * 24; // 1日

	//#region 1. 指定期間の内に投稿されたハッシュタグ(とユーザーのペア)を集計
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - span)
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

	let tags: {
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

	// タグを人気順に並べ替え
	tags.sort((a, b) => b.count - a.count);

	tags = tags.slice(0, 30);

	return tags;
});
