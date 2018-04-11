// for Node.js interpret

const mongodb = require("../../../built/db/mongodb");
const Post = mongodb.default.get('posts');
const { default: zip } = require('@prezzemolo/zip')
const html = require('../../../built/text/html').default;
const parse = require('../../../built/text/parse').default;

const migrate = async (post) => {
	const result = await Post.update(post._id, {
		$set: {
			textHtml: post.text ? html(parse(post.text)) : null
		}
	});
	return result.ok === 1;
}

async function main() {
	const count = await Post.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await Post.find({}, {
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
