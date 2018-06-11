import Note from '../../../../models/note';

/**
 * Get trends of hashtags
 */
module.exports = () => new Promise(async (res, rej) => {
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
			_id: { tags: '$tags', userId: '$userId' }
		}
	}]) as Array<{
		_id: {
			tags: string;
			userId: any;
		}
	}>;

	if (data.length == 0) {
		return res([]);
	}

	const tags = [];

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

	const hots = tags
		.sort((a, b) => b.count - a.count)
		.map(tag => tag.name)
		.slice(0, 5);

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

	const stats = hots.map((tag, i) => ({
		tag,
		chart: countsLog.map(counts => counts[i].length),
		usersCount: totalCounts[i].length
	}));

	res(stats);
});
