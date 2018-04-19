// for Node.js interpret

const { default: User } = require('../built/models/user');
const { default: Following } = require('../built/models/following');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (following) => {
	const follower = await User.findOne({ _id: following.followerId });
	const followee = await User.findOne({ _id: following.followeeId });
	const result = await Following.update(following._id, {
		$set: {
			stalk: true,
			_follower: {
				host: follower.host,
				inbox: follower.host != null ? follower.inbox : undefined
			},
			_followee: {
				host: followee.host,
				inbox: followee.host != null ? followee.inbox : undefined
			}
		}
	});
	return result.ok === 1;
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
				limit: dop, skip: time * dop
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
