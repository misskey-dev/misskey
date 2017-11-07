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
	const oldTypeDocs = await DriveFile.find({
		'metadata.name': {
			$exists: true
		}
	})
	return await Promise.all(oldTypeDocs.map(applyNewChange))
}

main().then(console.dir).catch(console.error)
