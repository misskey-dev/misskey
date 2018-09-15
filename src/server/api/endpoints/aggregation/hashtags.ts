import Note from '../../../../models/note';
import Meta from '../../../../models/meta';

export default () => new Promise(async (res, rej) => {
	const meta = await Meta.findOne({});
	const hidedTags = meta ? (meta.hidedTags || []).map(t => t.toLowerCase()) : [];

	const span = 1000 * 60 * 60 * 24 * 7; // 1週間

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
	}]) as Array<{
		_id: {
			tag: string;
			userId: any;
		}
	}>;
	//#endregion

	if (data.length == 0) {
		return res([]);
	}

	let tags: Array<{
		name: string;
		count: number;
	}> = [];

	// カウント
	data.map(x => x._id).forEach(x => {
		// ブラックリストに登録されているタグなら弾く
		if (hidedTags.includes(x.tag)) return;

		const i = tags.findIndex(tag => tag.name == x.tag);
		if (i != -1) {
			tags[i].count++;
		} else {
			tags.push({
				name: x.tag,
				count: 1
			});
		}
	});

	// タグを人気順に並べ替え
	tags = tags.sort((a, b) => b.count - a.count);

	tags = tags.slice(0, 30);

	res(tags);
});
