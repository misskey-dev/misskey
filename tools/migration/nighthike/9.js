// for Node.js interpret

const { default: Following } = require('../../../built/models/following');
const { default: FollowingLog } = require('../../../built/models/following-log');
const { default: FollowedLog } = require('../../../built/models/followed-log');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (following) => {
	const followingCount = await Following.count({
		followerId: following.followerId,
		createdAt: { $lt: following.createdAt },
		$or: [
			{ deletedAt: { $exists: false } },
			{ deletedAt: { $gt: following.createdAt } }
		]
	});
	await FollowingLog.insert({
		createdAt: following.createdAt,
		userId: following.followerId,
		count: followingCount + 1
	});

	const followersCount = await Following.count({
		followeeId: following.followeeId,
		createdAt: { $lt: following.createdAt },
		$or: [
			{ deletedAt: { $exists: false } },
			{ deletedAt: { $gt: following.createdAt } }
		]
	});
	await FollowedLog.insert({
		createdAt: following.createdAt,
		userId: following.followeeId,
		count: followersCount + 1
	});

	if (following.deletedAt) {
		const followingCount2 = await Following.count({
			followerId: following.followerId,
			createdAt: { $lt: following.deletedAt },
			$or: [
				{ deletedAt: { $exists: false } },
				{ deletedAt: { $gt: following.createdAt } }
			]
		});
		await FollowingLog.insert({
			createdAt: following.deletedAt,
			userId: following.followerId,
			count: followingCount2 - 1
		});

		const followersCount2 = await Following.count({
			followeeId: following.followeeId,
			createdAt: { $lt: following.deletedAt },
			$or: [
				{ deletedAt: { $exists: false } },
				{ deletedAt: { $gt: following.createdAt } }
			]
		});
		await FollowedLog.insert({
			createdAt: following.deletedAt,
			userId: following.followeeId,
			count: followersCount2 - 1
		});
	}

	return true;
}

async function main() {
	const count = await Following.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await Following.find({}, {
				limit: dop, skip: time * dop, sort: { _id: 1 }
			})
			return Promise.all(doc.map(migrate))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
