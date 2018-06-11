import Note from '../../../../models/note';

/**
 * Get trends of hashtags
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - 1000 * 60 * 60)
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
	}]) as Array<{
		tags: Array<{
			tag: string;
			count: number;
		}>
	}>;

	if (data.length == 0) {
		return res([]);
	}

	const hots = data[0].tags
		.sort((a, b) => a.count - b.count)
		.map(tag => tag.tag)
		.slice(0, 10);

	const countPromises: Array<Promise<number[]>> = [];

	for (let i = 0; i < 10; i++) {
		// 10分
		const interval = 1000 * 60 * 10;

		countPromises.push(Promise.all(hots.map(tag => Note.count({
			tags: tag,
			createdAt: {
				$lt: new Date(Date.now() - (interval * i)),
				$gt: new Date(Date.now() - (interval * (i + 1)))
			}
		}))));
	}

	const countsLog = await Promise.all(countPromises);

	const stats = hots.map((tag, i) => ({
		tag,
		chart: countsLog.map(counts => counts[i])
	}));

	console.log(stats);

	res(stats);
});
