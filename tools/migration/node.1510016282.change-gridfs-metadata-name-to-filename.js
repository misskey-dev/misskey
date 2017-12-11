// for Node.js interpret
/**
 * change usage of GridFS filename
 * see commit fb422b4d603c53a70712caba55b35a48a8c2e619
 */

const { default: DriveFile } = require('../../built/api/models/drive-file')

async function applyNewChange (doc) {
	const result = await DriveFile.update(doc._id, {
		$set: {
			filename: doc.metadata.name
		},
		$unset: {
			'metadata.name': ''
		}
	})
	return result.ok === 1
}

async function main () {
	const query = {
		'metadata.name': {
			$exists: true
		}
	}

	const count = await DriveFile.count(query)

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await DriveFile.find(query, {
				limit: dop, skip: time * dop
			})
			return Promise.all(doc.map(applyNewChange))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
