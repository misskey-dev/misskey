import Note from '../../../../models/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	requireCredential: false,
};

const span = 1000 * 60 * 60 * 24 * 7; // 1週間

const aggregate = (data: {
	_id: {
		tag: string;
		userId: any;
	}
}[], ignores: string[]) => Object.entries(data
		.map(x => x._id)
		.filter(x => !ignores.includes(x.tag))
		.reduce((a, c) => {
			a[c.tag] = ++a[c.tag] || 1;
			return a;
		}, {} as { [name: string]: number }))
	.sort(([, a], [, b]) => b - a)
	.slice(0, 30)
	.map(([name, count]) => ({ name, count }));

export default define(meta, () => fetchMeta()
	.then(instance => Note.aggregate([{
		$match: {
			createdAt: { $gt: new Date(Date.now() - span) },
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
	.then(x => aggregate(x, instance.hidedTags.map(t => t.toLowerCase())))));
