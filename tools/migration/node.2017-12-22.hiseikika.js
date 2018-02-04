// for Node.js interpret

const { default: Post } = require('../../built/api/models/post')
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (post) => {
	const x = {};
	if (post.reply_id != null) {
		const reply = await Post.findOne({
			_id: post.reply_id
		});
		x['_reply.user_id'] = reply.user_id;
	}
	if (post.repost_id != null) {
		const repost = await Post.findOne({
			_id: post.repost_id
		});
		x['_repost.user_id'] = repost.user_id;
	}
	if (post.reply_id != null || post.repost_id != null) {
		const result = await Post.update(post._id, {
			$set: x,
		});
		return result.ok === 1;
	} else {
		return true;
	}
}

async function main() {
	const query = {
		$or: [{
			reply_id: {
				$exists: true,
				$ne: null
			}
		}, {
			repost_id: {
				$exists: true,
				$ne: null
			}
		}]
	}

	const count = await Post.count(query);

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await Post.find(query, {
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
