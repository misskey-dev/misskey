// for Node.js interpret

const { default: db } = require('../../built/db/mongodb')
const { default: DriveFile, getGridFSBucket } = require('../../built/api/models/drive-file')
const { Duplex } = require('stream')

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

	delete doc._id
	delete doc.created_at
	delete doc.datasize
	delete doc.hash
	delete doc.data
	delete doc.name

	const bucket = await getGridFSBucket()
	const added = await writeToGridFS(bucket, buffer, id, name, { metadata: doc })

	const result = await DriveFile.update(id, {
		$set: {
			uploadDate: created_at
		}
	})

	return added && result.ok === 1
}

const main = async () => {
	const docs = await db.get('drive_files').find()
	const all = await Promise.all(docs.map(migrateToGridFS))
	return all
}

main().then(console.dir).catch(console.error)
