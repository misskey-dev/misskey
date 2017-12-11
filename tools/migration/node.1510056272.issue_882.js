// for Node.js interpret

const { default: DriveFile } = require('../../built/api/models/drive-file')
const { default: zip } = require('@prezzemolo/zip')

const migrate = async (doc) => {
	const result = await DriveFile.update(doc._id, {
		$set: {
			contentType: doc.metadata.type
		},
		$unset: {
			'metadata.type': ''
		}
	})
	return result.ok === 1
}

async function main() {
	const query = {
		'metadata.type': {
			$exists: true
		}
	}

	const count = await DriveFile.count(query);

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await DriveFile.find(query, {
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
