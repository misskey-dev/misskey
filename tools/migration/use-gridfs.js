// for Node.js interpret

const { default: db } = require('../../built/db/mongodb')
const { default: DriveFile, getGridFSBucket } = require('../../built/api/models/drive-file')
const { Duplex } = require('stream')
const { default: zip } = require('@prezzemolo/zip')

const writeToGridFS = (bucket, buffer, ...rest) => new Promise((resolve, reject) => {
	const writeStream = bucket.openUploadStreamWithId(...rest)

	const dataStream = new Duplex()
	dataStream.push(buffer)
	dataStream.push(null)

	writeStream.once('finish', resolve)
	writeStream.on('error', reject)

	dataStream.pipe(writeStream)
})

const migrateToGridFS = async (doc) => {
	const id = doc._id
	const buffer = doc.data ? doc.data.buffer : Buffer.from([0x00]) // アップロードのバグなのか知らないけどなぜか data が存在しない drive_file ドキュメントがまれにあることがわかったので
	const created_at = doc.created_at
	const name = doc.name
	const type = doc.type

	delete doc._id
	delete doc.created_at
	delete doc.datasize
	delete doc.hash
	delete doc.data
	delete doc.name
	delete doc.type

	const bucket = await getGridFSBucket()
	const added = await writeToGridFS(bucket, buffer, id, name, { contentType: type, metadata: doc })

	const result = await DriveFile.update(id, {
		$set: {
			uploadDate: created_at
		}
	})

	return added && result.ok === 1
}

async function main() {
	const count = await DriveFile.count({});

	console.log(`there are ${count} files.`)

	const dop = Number.parseInt(process.argv[2]) || 5
	const idop = ((count - (count % dop)) / dop) + 1

	return zip(
		1,
		async (time) => {
			console.log(`${time} / ${idop}`)
			const doc = await db.get('drive_files').find({}, { limit: dop, skip: time * dop })
			return Promise.all(doc.map(migrateToGridFS))
		},
		idop
	).then(a => {
		const rv = []
		a.forEach(e => rv.push(...e))
		return rv
	})
}

main().then(console.dir).catch(console.error)
