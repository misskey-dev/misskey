// for Node.js interpret

const { default: Othello } = require('../../built/api/models/othello-game')
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (doc) => {
	const x = {};

	doc.logs.forEach(log => {
		log.color = log.color == 'black';
	});

	const result = await Othello.update(doc._id, {
		$set: doc.logs
	});

	return result.ok === 1;
}

async function main() {

	const count = await Othello.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await Othello.find({}, {
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
