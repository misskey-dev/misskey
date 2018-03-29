// for Node.js interpret

const { default: App } = require('../../../built/api/models/app');
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (app) => {
	const result = await User.update(app._id, {
		$set: {
			'name_id': app.name_id.replace(/\-/g, '_'),
			'name_id_lower': app.name_id_lower.replace(/\-/g, '_')
		}
	});
	return result.ok === 1;
}

async function main() {
	const count = await App.count({});

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await App.find({}, {
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
