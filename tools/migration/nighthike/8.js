// for Node.js interpret

const { default: Message } = require('../../../built/api/models/message');
const { default: zip } = require('@prezzemolo/zip')
const html = require('../../../built/common/text/html').default;
const parse = require('../../../built/common/text/parse').default;

const migrate = async (message) => {
	const result = await Message.update(message._id, {
		$set: {
			textHtml: message.text ? html(parse(message.text)) : null
		}
	});
	return result.ok === 1;
}

async function main() {
	const count = await Message.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await Message.find({}, {
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
