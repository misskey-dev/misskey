import Note from '../../../../models/note';

export const meta = {
	requireCredential: true,
	requireAdmin: true
};

/**
 * Aggregate notes
 */
export default (params: any) => new Promise(async (res, rej) => {
	const query = [{
		$match: {
			createdAt: {
				$gt: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
			}
		}
	}, {
		$project: {
			renoteId: '$renoteId',
			replyId: '$replyId',
			user: '$_user',
			createdAt: { $add: ['$createdAt', 9 * 60 * 60 * 1000] } // Convert into JST
		}
	}, {
		$project: {
			date: {
				year: { $year: '$createdAt' },
				month: { $month: '$createdAt' },
				day: { $dayOfMonth: '$createdAt' }
			},
			type: {
				$cond: {
					if: { $ne: ['$renoteId', null] },
					then: 'renote',
					else: {
						$cond: {
							if: { $ne: ['$replyId', null] },
							then: 'reply',
							else: 'note'
						}
					}
				}
			},
			origin: {
				$cond: {
					if: { $eq: ['$user.host', null] },
					then: 'local',
					else: 'remote'
				}
			}
		}
	}, {
		$group: {
			_id: {
				date: '$date',
				type: '$type',
				origin: '$origin'
			},
			count: { $sum: 1 }
		}
	}, {
		$group: {
			_id: '$_id.date',
			data: {
				$addToSet: {
					type: '$_id.type',
					origin: '$_id.origin',
					count: '$count'
				}
			}
		}
	}] as any;

	const datas = await Note.aggregate(query);

	datas.forEach((data: any) => {
		data.date = data._id;
		delete data._id;

		data.localNotes = (data.data.filter((x: any) => x.type == 'note' && x.origin == 'local')[0] || { count: 0 }).count;
		data.localRenotes = (data.data.filter((x: any) => x.type == 'renote' && x.origin == 'local')[0] || { count: 0 }).count;
		data.localReplies = (data.data.filter((x: any) => x.type == 'reply' && x.origin == 'local')[0] || { count: 0 }).count;
		data.remoteNotes = (data.data.filter((x: any) => x.type == 'note' && x.origin == 'remote')[0] || { count: 0 }).count;
		data.remoteRenotes = (data.data.filter((x: any) => x.type == 'renote' && x.origin == 'remote')[0] || { count: 0 }).count;
		data.remoteReplies = (data.data.filter((x: any) => x.type == 'reply' && x.origin == 'remote')[0] || { count: 0 }).count;

		delete data.data;
	});

	const graph = [];

	for (let i = 0; i < 365; i++) {
		const day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter((d: any) =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data);
		} else {
			graph.push({
				date: { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() },
				localNotes: 0,
				localRenotes: 0,
				localReplies: 0,
				remoteNotes: 0,
				remoteRenotes: 0,
				remoteReplies: 0
			});
		}
	}

	res(graph);
});
