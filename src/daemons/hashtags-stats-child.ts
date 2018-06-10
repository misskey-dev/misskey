import Note from '../models/note';

// 10分
const interval = 1000 * 60 * 10;

async function tick() {
	const res = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - interval)
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
			_id: '$tags',
			count: {
				$sum: 1
			}
		}
	}, {
		$group: {
			_id: null,
			tags: {
				$push: {
					tag: '$_id',
					count: '$count'
				}
			}
		}
	}, {
		$project: {
			_id: false,
			tags: true
		}
	}]) as {
		tags: Array<{
			tag: string;
			count: number;
		}>
	};

	const stats = res.tags
		.sort((a, b) => a.count - b.count)
		.map(tag => [tag.tag, tag.count])
		.slice(0, 10);

	console.log(stats);

	process.send(stats);
}

tick();

setInterval(tick, interval);
